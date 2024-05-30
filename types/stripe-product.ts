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
