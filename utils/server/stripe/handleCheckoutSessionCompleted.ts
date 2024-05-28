import {
  STRIPE_PLAN_CODE_GPT4_CREDIT,
  STRIPE_PLAN_CODE_IMAGE_CREDIT,
  STRIPE_PLAN_CODE_ONE_TIME_PRO_PLAN_FOR_1_MONTH,
} from '@/utils/app/const';
import { serverSideTrackEvent } from '@/utils/app/eventTracking';

import { PluginID } from '@/types/plugin';
import { UserProfile } from '@/types/user';

import {
  addCredit,
  getAdminSupabaseClient,
  userProfileQuery,
} from '../supabase';
import updateUserAccount from './updateUserAccount';

import dayjs from 'dayjs';
import Stripe from 'stripe';

const supabase = getAdminSupabaseClient();

export default async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const userId = session.client_reference_id;
  const email = session.customer_details?.email;

  const planCode = session.metadata?.plan_code;
  const planGivingWeeks = session.metadata?.plan_giving_weeks;
  const credit = session.metadata?.credit;
  const stripeSubscriptionId = session.subscription as string;

  console.log({
    userId,
    email,
    planCode,
    planGivingWeeks,
    credit,
    stripeSubscriptionId,
  });
  if (!planCode && !planGivingWeeks) {
    throw new Error('no plan code or plan giving weeks from Stripe webhook');
  }

  if (!email) {
    throw new Error('missing Email from Stripe webhook');
  }

  const user = await userProfileQuery({
    client: supabase,
    email,
  });

  const isTopUpCreditRequest =
    (planCode === STRIPE_PLAN_CODE_IMAGE_CREDIT ||
      planCode === STRIPE_PLAN_CODE_GPT4_CREDIT) &&
    credit;
  // Handle TopUp Image Credit / GPT4 Credit
  if (isTopUpCreditRequest) {
    return await addCreditToUser(
      user,
      +credit,
      planCode === STRIPE_PLAN_CODE_IMAGE_CREDIT
        ? PluginID.IMAGE_GEN
        : PluginID.GPT4,
    );
  }

  const sinceDate = dayjs.unix(session.created).utc().toDate();
  // Retrieve user profile using email

  const proPlanExpirationDate = await getProPlanExpirationDate(
    planGivingWeeks,
    planCode,
    user,
    sinceDate,
  );

  serverSideTrackEvent(userId || 'N/A', 'New paying customer', {
    paymentDetail:
      !session.amount_subtotal || session.amount_subtotal <= 50000
        ? 'One-time'
        : 'Monthly',
  });

  // Update user account by User id
  if (userId) {
    await updateUserAccount({
      upgrade: true,
      userId,
      stripeSubscriptionId,
      proPlanExpirationDate: proPlanExpirationDate,
    });
  } else {
    // Update user account by Email
    await updateUserAccount({
      upgrade: true,
      email: email!,
      stripeSubscriptionId,
      proPlanExpirationDate: proPlanExpirationDate,
    });
  }
}

async function getProPlanExpirationDate(
  planGivingWeeks: string | undefined,
  planCode: string | undefined,
  user: UserProfile,
  sinceDate: Date,
): Promise<Date | undefined> {
  // Check if planGivingWeeks is defined and is a string
  if (planGivingWeeks && typeof planGivingWeeks === 'string') {
    const userProPlanExpirationDate = user?.proPlanExpirationDate;

    // User has a previous one-time pro plan or a referral trial
    if (userProPlanExpirationDate) {
      return dayjs(userProPlanExpirationDate)
        .add(+planGivingWeeks, 'week')
        .toDate();
    }
    // Error handling for monthly pro subscribers who should not buy one-time plans
    else if (user.plan === 'pro' && !user.proPlanExpirationDate) {
      throw new Error(
        'Monthly Pro subscriber bought one-time pro plan, should not happen',
        {
          cause: {
            user,
          },
        },
      );
    }
    // User is not a pro user yet
    else {
      return dayjs(sinceDate).add(+planGivingWeeks, 'week').toDate();
    }
  }
  // Handle one-month pro plan based on planCode
  else if (
    planCode?.toUpperCase() ===
    STRIPE_PLAN_CODE_ONE_TIME_PRO_PLAN_FOR_1_MONTH.toUpperCase()
  ) {
    return dayjs(sinceDate).add(1, 'month').toDate();
  }
  // Return undefined if no conditions are met
  return undefined;
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
