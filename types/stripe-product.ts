import { SubscriptionPlan } from './paid_plan';

export type StripeProductType = 'top_up' | 'paid_plan';

export type StripeProductPaidPlanType = Exclude<
  SubscriptionPlan,
  'free' | 'edu'
>;
export type StripeProductTopUpType =
  | '50_GPT4_CREDIT'
  | '150_GPT4_CREDIT'
  | '300_GPT4_CREDIT'
  | '100_IMAGE_CREDIT'
  | '500_IMAGE_CREDIT';

export type StripeProductName =
  | StripeProductPaidPlanType
  | StripeProductTopUpType;

export interface BaseStripeProduct {
  type: StripeProductType;
  productName: StripeProductName;
  productId: string;
}

export interface StripeTopUpProduct extends BaseStripeProduct {
  type: 'top_up';
  credit: number;
}

export interface StripePaidPlanProduct extends BaseStripeProduct {
  type: 'paid_plan';
}

export type NewStripeProduct = StripeTopUpProduct | StripePaidPlanProduct;

// TODO: To be remove START ================================
export type MemberShipPlanPeriodType = 'monthly' | 'yearly' | 'one-time';
export type MemberShipPlanCurrencyType = 'USD' | 'TWD';

// P.S. All of the code below is used in the product payment link
export type PlanCode =
  | 'one_time_pro_plan_for_1_month'
  | 'one_time_ultra_plan_for_1_month'
  | 'monthly_pro_plan_subscription'
  | 'monthly_ultra_plan_subscription'
  | 'yearly_pro_plan_subscription'
  | 'yearly_ultra_plan_subscription';

export interface MemberShipPlanItem {
  link: string;
  price_id: string;
}

export interface PlanDetails {
  plan_code: PlanCode;
  currencies: {
    [currency in MemberShipPlanCurrencyType]: MemberShipPlanItem;
  };
}

export interface MemberShipPlan {
  pro: {
    [period in MemberShipPlanPeriodType]: PlanDetails;
  };
  ultra: {
    [period in MemberShipPlanPeriodType]: PlanDetails;
  };
}
export interface StripeProduct {
  MEMBERSHIP_PLAN: MemberShipPlan;
}
// TODO: To be remove END =============================================
