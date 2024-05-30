import { PaidPlan, SubscriptionPlan, TopUpRequest } from '@/types/paid_plan';
import {
  MemberShipPlanCurrencyType,
  MemberShipPlanItem,
} from '@/types/stripe-product';

import {
  STRIPE_PLAN_CODE_GPT4_CREDIT,
  STRIPE_PLAN_CODE_IMAGE_CREDIT,
  STRIPE_PRODUCTS,
} from './const';

export const getPriceIdByPaidPlan = (
  paidPlan: PaidPlan,
  currency: MemberShipPlanCurrencyType,
): MemberShipPlanItem['price_id'] | undefined => {
  const PRO = STRIPE_PRODUCTS.MEMBERSHIP_PLAN.pro;
  const ULTRA = STRIPE_PRODUCTS.MEMBERSHIP_PLAN.ultra;

  switch (paidPlan) {
    // PRO
    case PaidPlan.ProMonthly:
      return PRO['monthly'].currencies[currency].price_id;
    case PaidPlan.ProOneTime:
      return PRO['one-time'].currencies[currency].price_id;
    case PaidPlan.ProYearly:
      return PRO['yearly'].currencies[currency].price_id;

    // ULTRA
    case PaidPlan.UltraMonthly:
      return ULTRA['monthly'].currencies[currency].price_id;
    case PaidPlan.UltraYearly:
      return ULTRA['yearly'].currencies[currency].price_id;
    case PaidPlan.UltraOneTime:
      return ULTRA['one-time'].currencies[currency].price_id;

    default:
      return undefined;
  }
};
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

export const getPaidPlanByPriceId = (priceId: string): PaidPlan | undefined => {
  for (const planType of ['pro', 'ultra'] as const) {
    for (const period of ['monthly', 'yearly', 'one-time'] as const) {
      const planDetails = STRIPE_PRODUCTS.MEMBERSHIP_PLAN[planType][period];
      if (planDetails) {
        for (const currency of Object.keys(
          planDetails.currencies,
        ) as MemberShipPlanCurrencyType[]) {
          if (planDetails.currencies[currency].price_id === priceId) {
            console.log(
              'current plan',
              getPaidPlanByPlanCode(planDetails.plan_code) as PaidPlan,
            );
            console.log('current plan currency ', currency);
            return getPaidPlanByPlanCode(planDetails.plan_code) as PaidPlan;
          }
        }
      }
    }
  }
  return undefined;
};
