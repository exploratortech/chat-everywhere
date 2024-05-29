import { PaidPlan, SubscriptionPlan, TopUpRequest } from '@/types/paid_plan';

import {
  STRIPE_PLAN_CODE_GPT4_CREDIT,
  STRIPE_PLAN_CODE_IMAGE_CREDIT,
  STRIPE_PLAN_CODE_MONTHLY_PRO_PLAN_SUBSCRIPTION,
  STRIPE_PLAN_CODE_MONTHLY_ULTRA_PLAN_SUBSCRIPTION,
  STRIPE_PLAN_CODE_ONE_TIME_PRO_PLAN_FOR_1_MONTH,
  STRIPE_PLAN_CODE_ONE_TIME_ULTRA_PLAN_FOR_1_MONTH,
  STRIPE_PLAN_CODE_YEARLY_ULTRA_PLAN_SUBSCRIPTION,
} from './const';

export const getPaidPlan = (
  planCode: string,
): PaidPlan | TopUpRequest | undefined => {
  switch (planCode.toUpperCase()) {
    case STRIPE_PLAN_CODE_MONTHLY_PRO_PLAN_SUBSCRIPTION.toUpperCase():
      return PaidPlan.ProMonthly;
    case STRIPE_PLAN_CODE_ONE_TIME_PRO_PLAN_FOR_1_MONTH.toUpperCase():
      return PaidPlan.ProOneTime;
    case STRIPE_PLAN_CODE_MONTHLY_ULTRA_PLAN_SUBSCRIPTION.toUpperCase():
      return PaidPlan.UltraMonthly;
    case STRIPE_PLAN_CODE_YEARLY_ULTRA_PLAN_SUBSCRIPTION.toUpperCase():
      return PaidPlan.UltraYearly;
    case STRIPE_PLAN_CODE_ONE_TIME_ULTRA_PLAN_FOR_1_MONTH.toUpperCase():
      return PaidPlan.UltraOneTime;
    case STRIPE_PLAN_CODE_IMAGE_CREDIT.toUpperCase():
      return TopUpRequest.ImageCredit;
    case STRIPE_PLAN_CODE_GPT4_CREDIT.toUpperCase():
      return TopUpRequest.GPT4Credit;
    default:
      return undefined;
  }
};

export const getSubscriptionPlanByPaidPlan = (
  paidPlan: PaidPlan,
): SubscriptionPlan => {
  switch (paidPlan) {
    case PaidPlan.ProMonthly:
      return 'pro';
    case PaidPlan.ProOneTime:
      return 'pro';
    case PaidPlan.UltraYearly:
      return 'ultra';
    case PaidPlan.UltraMonthly:
      return 'ultra';
    case PaidPlan.UltraOneTime:
      return 'ultra';
    default:
      return 'free';
  }
};
