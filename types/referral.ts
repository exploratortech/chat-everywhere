import { SubscriptionPlan } from './user';

export interface RawRefereeProfile {
  id: string;
  plan: SubscriptionPlan;
  stripe_subscription_id: string;
  pro_plan_expiration_date: string | null;
  referral_code: string | null;
  referral_code_expiration_date: string | null;
  email: string;
  referral_date: string;
}

export interface RefereeProfile {
  plan: SubscriptionPlan;
  email: string;
  referralDate: string;
  isInTrial: string;
  hasPaidForPro: string;
}
