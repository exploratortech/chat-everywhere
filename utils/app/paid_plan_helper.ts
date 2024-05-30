import { PaidPlan, SubscriptionPlan, TopUpRequest } from '@/types/paid_plan';

import {
  STRIPE_PLAN_CODE_GPT4_CREDIT,
  STRIPE_PLAN_CODE_IMAGE_CREDIT,
  STRIPE_PRODUCTS,
} from './const';

export const getPaidPlan = (
  planCode: string,
): PaidPlan | TopUpRequest | undefined => {
  switch (planCode.toUpperCase()) {
    case STRIPE_PRODUCTS.MEMBERSHIP_PLAN.pro.monthly.plan_code.toUpperCase():
      return PaidPlan.ProMonthly;
    case STRIPE_PRODUCTS.MEMBERSHIP_PLAN.pro[
      'one-time'
    ].plan_code.toUpperCase():
      return PaidPlan.ProOneTime;
    case STRIPE_PRODUCTS.MEMBERSHIP_PLAN.pro['yearly'].plan_code.toUpperCase():
      return PaidPlan.ProYearly;
    case STRIPE_PRODUCTS.MEMBERSHIP_PLAN.ultra.monthly.plan_code.toUpperCase():
      return PaidPlan.UltraMonthly;
    case STRIPE_PRODUCTS.MEMBERSHIP_PLAN.ultra.yearly.plan_code.toUpperCase():
      return PaidPlan.UltraYearly;
    case STRIPE_PRODUCTS.MEMBERSHIP_PLAN.ultra[
      'one-time'
    ].plan_code.toUpperCase():
      return PaidPlan.UltraOneTime;

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
