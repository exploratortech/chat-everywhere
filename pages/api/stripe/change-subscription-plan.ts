import { fetchUserProfileWithAccessToken } from '@/utils/server/auth';
import { fetchSubscriptionIdByUserId } from '@/utils/server/stripe/strip_helper';

import Stripe from 'stripe';
import { z } from 'zod';

export const config = {
  runtime: 'edge',
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

const handler = async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const requestBodySchema = z.object({
      priceId: z.string(),
    });

    const body = await req.json();
    const result = requestBodySchema.safeParse(body);
    if (!result.success) {
      return new Response('Invalid request body', { status: 400 });
    }
    const { priceId } = result.data;
    const newPaidPlanPriceId = priceId;

    // Step 1: Get User Profile and Subscription ID
    const userProfile = await fetchUserProfileWithAccessToken(req);
    if (userProfile.plan !== 'pro' && userProfile.plan !== 'ultra') {
      throw new Error('User does not have a paid plan');
    }
    const subscriptionId = await fetchSubscriptionIdByUserId(userProfile.id);
    if (!subscriptionId) {
      throw new Error('User does not have a valid subscription in Stripe');
    }

    // Step 2: Check if the new price id is valid
    const newPricePlan = await stripe.prices.retrieve(newPaidPlanPriceId);
    if (!newPricePlan) {
      throw new Error('New price id is not valid');
    }

    // Step 3: Retrieve Current Subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Check if user has any active items
    if (!(subscription.items.data?.[0].object === 'subscription_item')) {
      throw new Error('Subscription has no active subscription plan');
    }
    const currentPriceId = subscription.items.data?.[0].price;
    if (!currentPriceId) {
      throw new Error('Subscription has no active subscription plan');
    }

    // Step 4: Update Subscription
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPaidPlanPriceId,
          },
        ],
        proration_behavior: 'always_invoice',
      },
    );

    // Step 5: Retrieve Invoice URL
    const invoice = await stripe.invoices.retrieve(
      updatedSubscription.latest_invoice as string,
    );
    const invoiceUrl = invoice.hosted_invoice_url;

    return new Response(
      JSON.stringify({
        invoiceUrl: invoiceUrl,
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
