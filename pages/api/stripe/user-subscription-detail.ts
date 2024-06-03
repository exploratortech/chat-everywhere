import { fetchUserProfileWithAccessToken } from '@/utils/server/auth';
import StripeHelper, {
  fetchSubscriptionIdByUserId,
} from '@/utils/server/stripe/strip_helper';

import Stripe from 'stripe';

export const config = {
  runtime: 'edge',
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

const handler = async (req: Request) => {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // Step 1: Get User Profile and Subscription ID
    const userProfile = await fetchUserProfileWithAccessToken(req);
    if (userProfile.plan !== 'pro' && userProfile.plan !== 'ultra') {
      throw new Error('User is not in Paid plan');
    }
    const defaultResponse = () => {
      return new Response(
        JSON.stringify({
          data: undefined,
        }),
        { status: 200 },
      );
    };
    const subscriptionId = await fetchSubscriptionIdByUserId(userProfile.id);
    if (!subscriptionId) {
      return defaultResponse();
    }

    // Step 2: Retrieve Current Subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const productId = subscription.items.data[0].price.product;
    if (!productId || typeof productId !== 'string') {
      return defaultResponse();
    }
    const product = await StripeHelper.product.getProductByProductId(
      productId,
      'subscription',
    );
    if (product.type !== 'paid_plan') {
      return defaultResponse();
    }

    // Step 3: Extract User Plan and Currency
    const userPlan = product.productValue;
    const currency = subscription.currency;

    return new Response(
      JSON.stringify({
        data: {
          userPlan,
          subscriptionCurrency: currency,
        },
      }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return new Response(error.message, { status: 500 });
    }

    return new Response('Internal Server Error', { status: 500 });
  }
};

export default handler;
