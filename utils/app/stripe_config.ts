// P.S. All of the code below is used in the product payment link

// STRIPE CREDIT CODE
export const STRIPE_PLAN_CODE_GPT4_CREDIT = 'GPT4_CREDIT';
export const STRIPE_PLAN_CODE_IMAGE_CREDIT = 'IMAGE_CREDIT';

// STRIPE MONTHLY PLAN CODE
export const STRIPE_PLAN_CODE_MONTHLY_PRO_PLAN_SUBSCRIPTION =
  'monthly_pro_plan_subscription';
export const STRIPE_PLAN_CODE_MONTHLY_ULTRA_PLAN_SUBSCRIPTION =
  'monthly_ultra_plan_subscription';

// STRIPE ONE TIME PLAN CODE
export const STRIPE_PLAN_CODE_ONE_TIME_PRO_PLAN_FOR_1_MONTH =
  'one_time_pro_plan_for_1_month';

// (Not in used)
export const STRIPE_PLAN_CODE_ONE_TIME_ULTRA_PLAN_FOR_1_MONTH =
  'one_time_ultra_plan_for_1_month';

export const PRO_PLAN_PAYMENT_LINK =
  process.env.NEXT_PUBLIC_ENV === 'production'
    ? 'https://buy.stripe.com/8wM8Av2DM0u99fWfZ1'
    : 'https://buy.stripe.com/test_4gw4hLcvq52Odt6fYY';

export const ULTRA_PLAN_PAYMENT_LINK =
  process.env.NEXT_PUBLIC_ENV === 'production'
    ? 'https://buy.stripe.com/8wM8Av2DM0u99fWfZ1' // TODO: Update the production link
    : 'https://buy.stripe.com/test_00gcOhbrmgLwbkYdR0';

export const GPT4_CREDIT_PURCHASE_LINKS = {
  '50': 'https://buy.stripe.com/28o03Z0vE3Glak09AJ',
  '150': 'https://buy.stripe.com/cN2dUP6U2dgV0JqcMW',
  '300': 'https://buy.stripe.com/dR6g2Xemu5Otcs83cn',
};
export const AI_IMAGE_CREDIT_PURCHASE_LINKS = {
  '100': 'https://buy.stripe.com/fZeg2Xdiq4Kp8bS9AT',
  '500': 'https://buy.stripe.com/8wMg2XcemccR2Ry8wQ',
};

export const V2_CHAT_UPGRADE_LINK =
  process.env.NEXT_PUBLIC_ENV === 'production'
    ? 'https://buy.stripe.com/4gw9Ez6U2gt71NudRd'
    : 'https://buy.stripe.com/test_dR68y152Y7aWagUcMU';
