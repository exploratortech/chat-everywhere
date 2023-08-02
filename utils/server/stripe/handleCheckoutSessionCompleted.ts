import { PluginID } from '@/types/plugin';

import {
  addCredit,
  getAdminSupabaseClient,
  userProfileQuery,
} from '../supabase';
import updateUserAccount from './updateUserAccount';

import dayjs from 'dayjs';
import Stripe from 'stripe';

const MONTHLY_PRO_PLAN_SUBSCRIPTION =
  process.env.STRIPE_PLAN_CODE_MONTHLY_PRO_PLAN_SUBSCRIPTION;
const ONE_TIME_PRO_PLAN_FOR_1_MONTH =
  process.env.STRIPE_PLAN_CODE_ONE_TIME_PRO_PLAN_FOR_1_MONTH;

const IMAGE_CREDIT = process.env.STRIPE_PLAN_CODE_IMAGE_CREDIT;
const GPT4_CREDIT = process.env.STRIPE_PLAN_CODE_GPT4_CREDIT;

export default async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const userId = session.client_reference_id;
  const email = session.customer_details?.email;

  const planCode = session.metadata?.plan_code;
  const planGivingWeeks = session.metadata?.plan_giving_weeks;
  const credit = session.metadata?.credit;
  const stripeSubscriptionId = session.subscription as string;

  if (!planCode && !planGivingWeeks) {
    throw new Error('no plan code or plan giving weeks from Stripe webhook');
  }

  if (!email) {
    throw new Error('missing Email from Stripe webhook');
  }

  const isTopUpCreditRequest =
    (planCode === IMAGE_CREDIT || planCode === GPT4_CREDIT) && credit;
  // Handle TopUp Image Credit / GPT4 Credit
  if (isTopUpCreditRequest) {
    return await addCreditToUser(
      email,
      +credit,
      planCode === IMAGE_CREDIT ? PluginID.IMAGE_GEN : PluginID.GPT4,
    );
  }

  const sinceDate = dayjs.unix(session.created).utc().toDate();
  const proPlanExpirationDate = await getProPlanExpirationDate(
    planGivingWeeks,
    planCode,
    email,
    sinceDate,
  );

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
  email: string,
  sinceDate: Date,
) {
  // Takes plan_giving_weeks priority over plan_code
  if (planGivingWeeks && typeof planGivingWeeks === 'string') {
    // Get users' pro expiration date
    const supabase = getAdminSupabaseClient();
    const user = await userProfileQuery({
      client: supabase,
      email,
    });
    const userProPlanExpirationDate = user?.proPlanExpirationDate;
    if (userProPlanExpirationDate) {
      // when user bought one-time pro plan previously or user has referral trial
      return dayjs(userProPlanExpirationDate)
        .add(+planGivingWeeks, 'week')
        .toDate();
    } else if (user.plan === 'pro' && !user.proPlanExpirationDate) {
      // when user is pro monthly subscriber
      throw new Error(
        'Monthly Pro subscriber bought one-time pro plan, should not happen',
        {
          cause: {
            user,
          },
        },
      );
    } else {
      // when user is not pro yet
      return dayjs(sinceDate).add(+planGivingWeeks, 'week').toDate();
    }
  } else if (
    planCode?.toUpperCase() === ONE_TIME_PRO_PLAN_FOR_1_MONTH?.toUpperCase()
  ) {
    // Only store expiration for one month plan
    return dayjs(sinceDate).add(1, 'month').toDate();
  } else {
    return undefined;
  }
}

async function addCreditToUser(
  email: string,
  credit: number,
  creditType: Omit<PluginID, PluginID.LANGCHAIN_CHAT>,
) {
  // Get user id by email address
  const supabase = getAdminSupabaseClient();
  const user = await userProfileQuery({
    client: supabase,
    email,
  });
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
  await addCredit(userId, creditType as PluginID, credit);
}
