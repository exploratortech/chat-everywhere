import {
  STRIPE_PAID_PLAN_LINKS_PRODUCTION,
  STRIPE_PAID_PLAN_LINKS_STAGING,
} from './stripe_paid_plan_links_config';
import {
  STRIPE_PRODUCT_LIST_PRODUCTION,
  STRIPE_PRODUCT_LIST_STAGING,
} from './stripe_product_list_config';

// STRIPE CREDIT CODE
export const STRIPE_PLAN_CODE_GPT4_CREDIT = 'GPT4_CREDIT';
export const STRIPE_PLAN_CODE_IMAGE_CREDIT = 'IMAGE_CREDIT';

export const STRIPE_PRODUCT_LIST =
  process.env.NEXT_PUBLIC_ENV === 'production'
    ? STRIPE_PRODUCT_LIST_PRODUCTION
    : STRIPE_PRODUCT_LIST_STAGING;

export const STRIPE_PAID_PLAN_LINKS =
  process.env.NEXT_PUBLIC_ENV === 'production'
    ? STRIPE_PAID_PLAN_LINKS_PRODUCTION
    : STRIPE_PAID_PLAN_LINKS_STAGING;

// =========== TOP UP LINKS ===========
export const GPT4_CREDIT_PURCHASE_LINKS = {
  '50':
    process.env.NEXT_PUBLIC_ENV === 'production'
      ? 'https://buy.stripe.com/28o03Z0vE3Glak09AJ'
      : 'https://buy.stripe.com/test_9AQ01v8fabrccp228b',
  '150':
    process.env.NEXT_PUBLIC_ENV === 'production'
      ? 'https://buy.stripe.com/cN2dUP6U2dgV0JqcMW'
      : 'https://buy.stripe.com/test_9AQ01v8fabrccp228b',
  '300':
    process.env.NEXT_PUBLIC_ENV === 'production'
      ? 'https://buy.stripe.com/dR6g2Xemu5Otcs83cn'
      : 'https://buy.stripe.com/test_9AQ01v8fabrccp228b',
};
export const AI_IMAGE_CREDIT_PURCHASE_LINKS = {
  '100':
    process.env.NEXT_PUBLIC_ENV === 'production'
      ? 'https://buy.stripe.com/fZeg2Xdiq4Kp8bS9AT'
      : 'https://buy.stripe.com/test_9AQ01v8fabrccp228b',
  '500':
    process.env.NEXT_PUBLIC_ENV === 'production'
      ? 'https://buy.stripe.com/8wMg2XcemccR2Ry8wQ'
      : 'https://buy.stripe.com/test_9AQ01v8fabrccp228b',
};

// =========== V2 UPGRADE LINKS ===========
export const V2_CHAT_UPGRADE_LINK =
  process.env.NEXT_PUBLIC_ENV === 'production'
    ? 'https://buy.stripe.com/4gw9Ez6U2gt71NudRd'
    : 'https://buy.stripe.com/test_dR68y152Y7aWagUcMU';
