import { PaidPlanLinks } from '@/types/stripe-product';

export const STRIPE_PAID_PLAN_LINKS_PRODUCTION: PaidPlanLinks = {
  'ultra-yearly': {
    twd: {
      // $8,800.00 TWD / year
      link: 'https://buy.stripe.com/6oEaID6U2b8Ncs85kK',
      price_id: 'price_1PGVh6EEvfd1Bzvu3OyJGTZ2',
    },
    usd: {
      // $279.99 USD / year
      link: 'https://buy.stripe.com/fZebMH0vEdgVeAg3cF',
      price_id: 'price_1PMSCyEEvfd1Bzvuk7VHjx6S',
    },
  },
  'ultra-monthly': {
    twd: {
      // $880.00 TWD / month
      link: 'https://buy.stripe.com/8wMeYT92aekZ0Jq9B1',
      price_id: 'price_1PMS9KEEvfd1BzvuBCA4LAJA',
    },
    usd: {
      // $29.99 USD / month
      link: 'https://buy.stripe.com/4gwbMH6U27WB9fW9B2',
      price_id: 'price_1PMSBdEEvfd1BzvuqUuMvUv7',
    },
  },
  'pro-monthly': {
    twd: {
      // $249.99 TWD / month
      link: 'https://buy.stripe.com/dR65oj2DM90FeAgcNg',
      price_id: 'price_1PMSIDEEvfd1BzvuegdR9cyP',
    },
    usd: {
      // $9.99 USD / month
      link: 'https://buy.stripe.com/8wM8Av2DM0u99fWfZ1',
      price_id: 'price_1N1VMjEEvfd1BzvuWqqVu9YZ',
    },
  },
};

export const STRIPE_PAID_PLAN_LINKS_STAGING: PaidPlanLinks = {
  'ultra-yearly': {
    twd: {
      // $8,800.00 TWD / year
      link: 'https://buy.stripe.com/test_8wM9C5fHCan8agUdR9',
      price_id: 'price_1PLiWVEEvfd1Bzvu7voi21Jw',
    },
    usd: {
      // $279.99 USD / year
      link: 'https://buy.stripe.com/test_3csaG952Y2UG74IfZg',
      price_id: 'price_1PLiWmEEvfd1BzvuDFmiLKI6',
    },
  },
  'ultra-monthly': {
    twd: {
      // $880.00 TWD / month
      link: 'https://buy.stripe.com/test_fZe6pT1QM1QC2Os6oF',
      price_id: 'price_1PLiWBEEvfd1BzvunVr1yZ55',
    },
    usd: {
      // $29.99 USD / month
      link: 'https://buy.stripe.com/test_cN29C5dzu8f0dt6fZe',
      price_id: 'price_1PLhlhEEvfd1Bzvu0UEqwm9y',
    },
  },
  'pro-monthly': {
    twd: {
      //
      link: 'https://buy.stripe.com/test_6oE01v1QM66S74I7sH',
      price_id: 'price_1PLhJREEvfd1BzvuxCM477DD',
    },
    usd: {
      link: 'https://buy.stripe.com/test_4gw4hLcvq52Odt6fYY',
      price_id: 'price_1N09fTEEvfd1BzvuJwBCAfg2',
    },
  },
};
