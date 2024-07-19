import type { SubscriptionPlan } from './paid_plan';

import type Stripe from 'stripe';

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
  mode: Stripe.Checkout.Session.Mode;
  productValue: StripeProductName;
  productId: string;
  note?: string;
}

export interface StripeTopUpProduct extends BaseStripeProduct {
  type: 'top_up';
  credit: number;
}

export type StripePaidPlanProduct =
  | StripeSubscriptionPaidPlanProduct
  | StripeOneTimePaidPlanProduct;
export interface StripeSubscriptionPaidPlanProduct extends BaseStripeProduct {
  type: 'paid_plan';
  mode: 'subscription';
}
export interface StripeOneTimePaidPlanProduct extends BaseStripeProduct {
  type: 'paid_plan';
  mode: 'payment';
  givenDays: number;
}

export type NewStripeProduct = StripeTopUpProduct | StripePaidPlanProduct;

export type PaidPlanCurrencyType = 'usd' | 'twd';
export type AvailablePaidPlanType =
  | 'ultra-yearly'
  | 'ultra-monthly'
  | 'pro-monthly';

export type PaidPlanLink = {
  [currency in PaidPlanCurrencyType]: {
    price_id: string;
    link: string;
  };
};

export type PaidPlanLinks = Record<AvailablePaidPlanType, PaidPlanLink>;
