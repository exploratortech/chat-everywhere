import {
  getPaidPlanByPriceId,
  getPriceIdByPaidPlan,
} from '@/utils/app/paid_plan_helper';
import { fetchUserProfileWithAccessToken } from '@/utils/server/auth';
import { fetchSubscriptionIdByUserId } from '@/utils/server/stripe/strip_helper';

import { PaidPlan } from '@/types/paid_plan';
import { MemberShipPlanCurrencyType } from '@/types/stripe-product';

import Stripe from 'stripe';

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
    // TODO: add zod validation to validate if the request newPaidPlan is the PaidPlan type
    // TODO: add zod validation to validate if the request currency is the MemberShipPlanCurrencyType type
    const newPaidPlan = PaidPlan.UltraMonthly;
    const currency = 'TWD' as MemberShipPlanCurrencyType;
    const newPriceId = getPriceIdByPaidPlan(newPaidPlan, currency);
    if (!newPriceId) {
      throw new Error('New plan is not a valid plan');
    }

    // Step 1: Get User Profile and Subscription ID
    const userProfile = await fetchUserProfileWithAccessToken(req);
    if (userProfile.plan !== 'pro' && userProfile.plan !== 'ultra') {
      throw new Error('User does not have a paid plan');
    }
    const subscriptionId = await fetchSubscriptionIdByUserId(userProfile.id);
    if (!subscriptionId) {
      throw new Error('User does not have a valid subscription in Stripe');
    }

    // Step 2: Retrieve Current Subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log({
      subscription,
    });
    // Check if user has any active items
    if (!(subscription.items.data?.[0].object === 'subscription_item')) {
      throw new Error('Subscription has no active subscription plan');
    }
    const currentPaidPlan = getPaidPlanByPriceId(
      subscription.items.data[0].plan.id,
    );

    if (!currentPaidPlan) {
      throw new Error('Subscription has no active subscription plan');
    }
    if (currentPaidPlan === newPaidPlan) {
      throw new Error(
        'The current Subscription plan is the same as the new plan',
      );
    }

    // Step 3: Calculate Proration
    const prorationDate = Math.floor(Date.now() / 1000);

    // Step 4: Update Subscription
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations',
      },
    );

    // Step 5: Notify User
    // For this example, we'll just return the updated subscription details

    // TODO:Lets see if it called the stripe webhooks to update our db

    return new Response(
      JSON.stringify({
        previousSubscription: subscription,
        newSubscription: updatedSubscription,
        prorationDate,
      }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

export default handler;
