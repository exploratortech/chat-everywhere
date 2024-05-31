import { PaidPlanLinks } from '@/types/stripe-product';

export const STRIPE_PAID_PLAN_LINKS_PRODUCTION: PaidPlanLinks = {
  'ultra-yearly': {
    usd: {
      link: '',
      price_id: '',
    },
    twd: {
      link: '',
      price_id: '',
    },
  },
  'ultra-monthly': {
    twd: {
      link: '',
      price_id: '',
    },
    usd: {
      link: '',
      price_id: '',
    },
  },
  'pro-monthly': {
    twd: {
      link: '',
      price_id: '',
    },
    usd: {
      link: 'https://buy.stripe.com/8wM8Av2DM0u99fWfZ1',
      price_id: '',
    },
  },
};

export const STRIPE_PAID_PLAN_LINKS_STAGING: PaidPlanLinks = {
  'ultra-yearly': {
    usd: {
      link: 'https://buy.stripe.com/test_3csaG952Y2UG74IfZg',
      price_id: 'price_1PLiWmEEvfd1BzvuDFmiLKI6',
    },
    twd: {
      link: 'https://buy.stripe.com/test_8wM9C5fHCan8agUdR9',
      price_id: 'price_1PLiWVEEvfd1Bzvu7voi21Jw',
    },
  },
  'ultra-monthly': {
    twd: {
      link: 'https://buy.stripe.com/test_fZe6pT1QM1QC2Os6oF',
      price_id: 'price_1PLiWBEEvfd1BzvunVr1yZ55',
    },
    usd: {
      link: 'https://buy.stripe.com/test_cN29C5dzu8f0dt6fZe',
      price_id: 'price_1PLhlhEEvfd1Bzvu0UEqwm9y',
    },
  },
  'pro-monthly': {
    twd: {
      link: 'https://buy.stripe.com/test_6oE01v1QM66S74I7sH',
      price_id: 'price_1PLhJREEvfd1BzvuxCM477DD',
    },
    usd: {
      link: 'https://buy.stripe.com/test_4gw4hLcvq52Odt6fYY',
      price_id: 'price_1N09fTEEvfd1BzvuJwBCAfg2',
    },
  },
};
