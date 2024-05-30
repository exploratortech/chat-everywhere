import { NewStripeProduct, StripeProduct } from '@/types/stripe-product';

// STRIPE CREDIT CODE
export const STRIPE_PLAN_CODE_GPT4_CREDIT = 'GPT4_CREDIT';
export const STRIPE_PLAN_CODE_IMAGE_CREDIT = 'IMAGE_CREDIT';

// Add production one
const STRIPE_PRODUCT_LIST_STAGING: NewStripeProduct[] = [
  {
    type: 'paid_plan',
    productValue: 'ultra',
    productId: 'prod_QC5xRJFNyaB3h7',
  },
  {
    type: 'paid_plan',
    productValue: 'pro',
    productId: 'prod_Nlh3dRKPO799ja',
  },
  {
    type: 'top_up',
    productValue: '50_GPT4_CREDIT',
    productId: 'prod_OKKu2YQZyaJTYN',
    credit: 50,
  },
  {
    type: 'top_up',
    productValue: '150_GPT4_CREDIT',
    productId: 'prod_OKKu2YQZyaJTYN',
    credit: 150,
  },
  {
    type: 'top_up',
    productValue: '300_GPT4_CREDIT',
    productId: 'prod_OKKu2YQZyaJTYN',
    credit: 300,
  },
  {
    type: 'top_up',
    productValue: '500_IMAGE_CREDIT',
    productId: 'prod_OKJgVwM66OOWuR',
    credit: 500,
  },
  {
    type: 'top_up',
    productValue: '100_IMAGE_CREDIT',
    productId: 'prod_OKJgVwM66OOWuR',
    credit: 100,
  },
];
const STRIPE_PRODUCT_LIST_PRODUCTION: NewStripeProduct[] = [
  {
    type: 'paid_plan',
    productValue: 'ultra',
    productId: 'prod_Q6j96oOouZMFN4',
  },
  {
    type: 'paid_plan',
    productValue: 'ultra',
    productId: 'prod_PGES2QxP0aYFr4',
    note: 'This is the pre-sell plan for the Ultra plan',
  },

  {
    type: 'paid_plan',
    productValue: 'pro',
    productId: 'prod_NlR6az1csuoBHl',
  },
  {
    type: 'top_up',
    productValue: '50_GPT4_CREDIT',
    productId: 'prod_Nofw6ncuYiYD81',
    credit: 50,
  },
  {
    type: 'top_up',
    productValue: '150_GPT4_CREDIT',
    productId: 'prod_Nog8i22B8eLX6y',
    credit: 150,
  },
  {
    type: 'top_up',
    productValue: '300_GPT4_CREDIT',
    productId: 'prod_Nog91rmXzSJY1w',
    credit: 300,
  },
  {
    type: 'top_up',
    productValue: '100_IMAGE_CREDIT',
    productId: 'prod_OKYWXZGkysAtFS',
    credit: 100,
  },
  {
    type: 'top_up',
    productValue: '500_IMAGE_CREDIT',
    productId: 'prod_OKYouQss6inD9q',
    credit: 500,
  },
];

export const STRIPE_PRODUCT_LIST =
  process.env.NEXT_PUBLIC_ENV === 'production'
    ? STRIPE_PRODUCT_LIST_PRODUCTION
    : STRIPE_PRODUCT_LIST_STAGING;

const STRIPE_PRODUCTS_PRODUCTION: StripeProduct = {
  MEMBERSHIP_PLAN: {
    pro: {
      monthly: {
        // META DATA use in the payment link
        plan_code: 'monthly_pro_plan_subscription',
        currencies: {
          USD: {
            link: 'https://buy.stripe.com/8wM8Av2DM0u99fWfZ1',
            price_id: '',
          },
          TWD: {
            link: '',
            price_id: '',
          },
        },
      },
      // NOTE: NOT IN USED IN APP
      'one-time': {
        plan_code: 'one_time_pro_plan_for_1_month',
        currencies: {
          USD: {
            link: '',
            price_id: '',
          },
          TWD: {
            link: '',
            price_id: '',
          },
        },
      },
      // NOTE: NOT IN USED IN APP
      yearly: {
        plan_code: 'yearly_pro_plan_subscription',
        currencies: {
          USD: {
            link: '',
            price_id: '',
          },
          TWD: {
            link: '',
            price_id: '',
          },
        },
      },
    },
    ultra: {
      'one-time': {
        plan_code: 'one_time_ultra_plan_for_1_month',
        currencies: {
          USD: {
            link: '',
            price_id: '',
          },
          TWD: {
            link: '',
            price_id: '',
          },
        },
      },
      monthly: {
        plan_code: 'monthly_ultra_plan_subscription',
        currencies: {
          USD: {
            link: '',
            price_id: '',
          },
          TWD: {
            link: '',
            price_id: '',
          },
        },
      },
      yearly: {
        plan_code: 'yearly_ultra_plan_subscription',
        currencies: {
          USD: {
            link: '',
            price_id: '',
          },
          TWD: {
            link: '',
            price_id: '',
          },
        },
      },
    },
  },
};

const STRIPE_PRODUCTS_STAGING: StripeProduct = {
  MEMBERSHIP_PLAN: {
    pro: {
      // NOTE: NOT IN USED IN APP
      'one-time': {
        plan_code: 'one_time_pro_plan_for_1_month',
        currencies: {
          USD: {
            link: '',
            price_id: '',
          },
          TWD: {
            link: '',
            price_id: '',
          },
        },
      },
      monthly: {
        // META DATA use in the payment link
        plan_code: 'monthly_pro_plan_subscription',
        currencies: {
          USD: {
            link: 'https://buy.stripe.com/test_4gw4hLcvq52Odt6fYY',
            price_id: 'price_1N09fTEEvfd1BzvuJwBCAfg2',
          },
          TWD: {
            link: 'https://buy.stripe.com/test_6oE01v1QM66S74I7sH',
            price_id: 'price_1PLhJREEvfd1BzvuxCM477DD',
          },
        },
      },
      // NOTE: NOT IN USED IN APP
      yearly: {
        plan_code: 'yearly_pro_plan_subscription',
        currencies: {
          USD: {
            link: '',
            price_id: '',
          },
          TWD: {
            link: '',
            price_id: '',
          },
        },
      },
    },
    ultra: {
      // NOTE: NOT IN USED IN APP
      'one-time': {
        plan_code: 'one_time_ultra_plan_for_1_month',
        currencies: {
          USD: {
            link: '',
            price_id: '',
          },
          TWD: {
            link: '',
            price_id: '',
          },
        },
      },
      monthly: {
        plan_code: 'monthly_ultra_plan_subscription',
        currencies: {
          USD: {
            link: 'https://buy.stripe.com/test_cN29C5dzu8f0dt6fZe',
            price_id: 'price_1PLhlhEEvfd1Bzvu0UEqwm9y',
          },
          TWD: {
            link: 'https://buy.stripe.com/test_fZe6pT1QM1QC2Os6oF',
            price_id: 'price_1PLiWBEEvfd1BzvunVr1yZ55',
          },
        },
      },
      yearly: {
        plan_code: 'yearly_ultra_plan_subscription',
        currencies: {
          USD: {
            link: 'https://buy.stripe.com/test_3csaG952Y2UG74IfZg',
            price_id: 'price_1PLiWmEEvfd1BzvuDFmiLKI6',
          },
          TWD: {
            link: 'https://buy.stripe.com/test_8wM9C5fHCan8agUdR9',
            price_id: 'price_1PLiWVEEvfd1Bzvu7voi21Jw',
          },
        },
      },
    },
  },
};

export const STRIPE_PRODUCTS =
  process.env.NEXT_PUBLIC_ENV === 'production'
    ? STRIPE_PRODUCTS_PRODUCTION
    : STRIPE_PRODUCTS_STAGING;

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
