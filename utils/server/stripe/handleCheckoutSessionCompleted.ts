import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import {
  getDbSubscriptionPlanByPaidPlan,
  getPaidPlanByPlanCode,
} from '@/utils/app/paid_plan_helper';

import { PaidPlan, TopUpRequest } from '@/types/paid_plan';
import { PluginID } from '@/types/plugin';
import { UserProfile } from '@/types/user';

import {
  addCredit,
  getAdminSupabaseClient,
  userProfileQuery,
} from '../supabase';
import {
  updateUserAccountByEmail,
  updateUserAccountById,
} from './strip_helper';

import dayjs from 'dayjs';
import Stripe from 'stripe';

const supabase = getAdminSupabaseClient();

export default async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const userId = session.client_reference_id;
  const email = session.customer_details?.email;

  const planCode = session.metadata?.plan_code
    ? getPaidPlanByPlanCode(session.metadata?.plan_code)
    : undefined;
  const planGivingWeeks = session.metadata?.plan_giving_weeks;
  const credit = session.metadata?.credit;
  const stripeSubscriptionId = session.subscription as string;

  if (!planCode && !planGivingWeeks) {
    throw new Error(
      'no plan code and plan giving weeks from Stripe webhook, one of them must be provided',
    );
  }

  if (!email) {
    throw new Error('missing Email from Stripe webhook');
  }

  const user = await userProfileQuery({
    client: supabase,
    email,
  });

  const isTopUpCreditRequest = Object.values(TopUpRequest).includes(
    planCode as TopUpRequest,
  );

  // # REQUEST: Top Up Image Credit / GPT4 Credit
  if (isTopUpCreditRequest && credit) {
    return await addCreditToUser(
      user,
      +credit,
      planCode === TopUpRequest.ImageCredit
        ? PluginID.IMAGE_GEN
        : PluginID.GPT4,
    );
  }

  // # REQUEST: Upgrade plan
  return await (async () => {
    const sessionCreatedDate = dayjs.unix(session.created).utc().toDate();
    const userIsInPaidPlan = user.plan !== 'free' && user.plan !== 'edu';
    const isBuyingOneTimePlan =
      planCode === PaidPlan.ProOneTime || planCode === PaidPlan.UltraOneTime;
    if (userIsInPaidPlan && isBuyingOneTimePlan) {
      throw new Error(
        'One-time plan purchase is disallowed for users already on a paid subscription plan',
        {
          cause: {
            user,
          },
        },
      );
    }
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

    // Extend membership expiration date if user has a pro plan expiration date already
    const proPlanExpirationDate = await calculateMembershipExpirationDate(
      planGivingWeeks,
      planCode,
      sessionCreatedDate,
    );

    serverSideTrackEvent(userId || 'N/A', 'New paying customer', {
      paymentDetail:
        !session.amount_subtotal || session.amount_subtotal <= 50000
          ? 'One-time'
          : 'Monthly',
    });

    if (!proPlanExpirationDate) {
      throw new Error('calculate membership expiration date: undefined ', {
        cause: {
          user,
        },
      });
    }

    // Update user account by User id
    if (userId) {
      await updateUserAccountById({
        userId,
        plan: getDbSubscriptionPlanByPaidPlan(planCode as PaidPlan),
        stripeSubscriptionId,
        proPlanExpirationDate: proPlanExpirationDate,
      });
    } else {
      // Update user account by Email
      await updateUserAccountByEmail({
        email: email!,
        plan: getDbSubscriptionPlanByPaidPlan(planCode as PaidPlan),
        stripeSubscriptionId,
        proPlanExpirationDate: proPlanExpirationDate,
      });
    }
  })();
}

async function calculateMembershipExpirationDate(
  planGivingWeeks: string | undefined,
  planCode: string | undefined,
  sessionCreatedDate: Date,
): Promise<Date | undefined> {
  const previousDate = dayjs(sessionCreatedDate || undefined);
  // If has planGivingWeeks, use it to calculate the expiration date
  if (planGivingWeeks && typeof planGivingWeeks === 'string') {
    return previousDate.add(+planGivingWeeks, 'week').toDate();
  }
  // else extend the expiration date based on the plan code
  else if (planCode === PaidPlan.ProOneTime) {
    return previousDate.add(1, 'month').toDate();
  } else if (planCode === PaidPlan.ProMonthly) {
    return previousDate.add(1, 'month').toDate();
  } else if (planCode === PaidPlan.UltraOneTime) {
    return previousDate.add(1, 'month').toDate();
  } else if (planCode === PaidPlan.UltraMonthly) {
    return previousDate.add(1, 'month').toDate();
  } else if (planCode === PaidPlan.UltraYearly) {
    return previousDate.add(1, 'year').toDate();
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
