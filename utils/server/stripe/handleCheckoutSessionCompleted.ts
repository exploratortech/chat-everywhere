import { serverSideTrackEvent } from '@/utils/app/eventTracking';

import { PluginID } from '@/types/plugin';
import { NewStripeProduct } from '@/types/stripe-product';
import { UserProfile } from '@/types/user';

import {
  addCredit,
  getAdminSupabaseClient,
  userProfileQuery,
} from '../supabase';
import StripeHelper, {
  updateUserAccountByEmail,
  updateUserAccountById,
} from './strip_helper';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Stripe from 'stripe';

const supabase = getAdminSupabaseClient();

dayjs.extend(utc);

export default async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const userId = session.client_reference_id;
  const email = session.customer_details?.email;

  const stripeSubscriptionId = session.subscription as string;

  const sessionId = session.id;
  const product = await StripeHelper.product.getProductBySessionId(sessionId);

  if (!email) {
    throw new Error('missing Email from Stripe webhook');
  }
  const user = await userProfileQuery({
    client: supabase,
    email,
  });

  // # Upgrade plan flow
  if (product.type === 'paid_plan') {
    if (session.mode === 'subscription') {
      // Recurring payment flow
      await handleSubscription(
        session,
        user,
        product,
        stripeSubscriptionId,
        userId || undefined,
        email || undefined,
      );
    } else if (session.mode === 'payment') {
      // One-time payment flow
      throw new Error(
        'One-time payment flow not implemented, need to setup user account manually',
        {
          cause: {
            email,
            product,
            session,
          },
        },
      );
    } else {
      throw new Error(`Unhandled session mode ${session.mode}`, {
        cause: {
          session,
          product,
        },
      });
    }
  } else {
    // Top Up Credit flow
    return await addCreditToUser(
      user,
      product.credit,
      product.productName === '500_IMAGE_CREDIT' ||
        product.productName === '100_IMAGE_CREDIT'
        ? PluginID.IMAGE_GEN
        : PluginID.GPT4,
    );
  }
}

async function addCreditToUser(
  user: UserProfile,
  credit: number,
  creditType: Exclude<
    PluginID,
    PluginID.LANGCHAIN_CHAT | PluginID.IMAGE_TO_PROMPT
  >,
) {
  // Check is Pro user
  if (user.plan === 'free') {
    throw Error(`A free user try to top up ${creditType}}`, {
      cause: {
        user,
      },
    });
  }

  // Add usage entry by user id
  const userId = user?.id;

  // add credit to user account
  await addCredit(
    userId,
    creditType as Exclude<
      PluginID,
      | PluginID.LANGCHAIN_CHAT
      | PluginID.IMAGE_TO_PROMPT
      | PluginID.aiPainter
      | PluginID.default
      | PluginID.GEMINI
    >,
    credit,
  );
}

async function handleSubscription(
  session: Stripe.Checkout.Session,
  user: UserProfile,
  product: NewStripeProduct,
  stripeSubscriptionId: string,
  userId: string | undefined,
  email: string | undefined,
) {
  const subscription = await StripeHelper.subscription.getSubscriptionById(
    stripeSubscriptionId,
  );
  const currentPeriodEnd = dayjs
    .unix(subscription.current_period_end)
    .utc()
    .toDate();

  const userIsInPaidPlan = user.plan !== 'free' && user.plan !== 'edu';
  if (userIsInPaidPlan) {
    throw new Error(
      'User is already in a paid plan, cannot purchase a new plan, should issue an refund',
      {
        cause: {
          user,
        },
      },
    );
  }
  serverSideTrackEvent(userId || 'N/A', 'New paying customer', {
    paymentDetail:
      !session.amount_subtotal || session.amount_subtotal <= 50000
        ? 'One-time'
        : 'Monthly',
  });

  // Update user account by User id
  if (userId) {
    await updateUserAccountById({
      userId,
      plan: product.productName,
      stripeSubscriptionId,
      proPlanExpirationDate: currentPeriodEnd,
    });
  } else {
    // Update user account by Email
    await updateUserAccountByEmail({
      email: email!,
      plan: product.productName,
      stripeSubscriptionId,
      proPlanExpirationDate: currentPeriodEnd,
    });
  }
}
