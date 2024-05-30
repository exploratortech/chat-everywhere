import { PaidPlan, SubscriptionPlan, TopUpRequest } from '@/types/paid_plan';

import {
  STRIPE_PLAN_CODE_GPT4_CREDIT,
  STRIPE_PLAN_CODE_IMAGE_CREDIT,
  STRIPE_PRODUCTS,
} from './const';

export const getPaidPlanByPlanCode = (
  planCode: string,
): PaidPlan | TopUpRequest | undefined => {
  const PRO = STRIPE_PRODUCTS.MEMBERSHIP_PLAN.pro;
  const ULTRA = STRIPE_PRODUCTS.MEMBERSHIP_PLAN.ultra;

  switch (planCode.toUpperCase()) {
    // PRO
    case PRO['monthly'].plan_code.toUpperCase():
      return PaidPlan.ProMonthly;
    case PRO['one-time'].plan_code.toUpperCase():
      return PaidPlan.ProOneTime;
    case PRO['yearly'].plan_code.toUpperCase():
      return PaidPlan.ProYearly;

    // ULTRA
    case ULTRA['monthly'].plan_code.toUpperCase():
      return PaidPlan.UltraMonthly;
    case ULTRA['yearly'].plan_code.toUpperCase():
      return PaidPlan.UltraYearly;
    case ULTRA['one-time'].plan_code.toUpperCase():
      return PaidPlan.UltraOneTime;

    // TOP UP REQUEST
    case STRIPE_PLAN_CODE_IMAGE_CREDIT.toUpperCase():
      return TopUpRequest.ImageCredit;
    case STRIPE_PLAN_CODE_GPT4_CREDIT.toUpperCase():
      return TopUpRequest.GPT4Credit;
    default:
      return undefined;
  }
};

export const getDbSubscriptionPlanByPaidPlan = (
  paidPlan: PaidPlan,
): SubscriptionPlan => {
  switch (paidPlan) {
    case PaidPlan.ProMonthly:
      return 'pro';
    case PaidPlan.ProOneTime:
      return 'pro';
    case PaidPlan.ProYearly:
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
