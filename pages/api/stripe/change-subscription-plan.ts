import { fetchUserProfileWithAccessToken } from '@/utils/server/auth';
import { fetchSubscriptionIdByUserId } from '@/utils/server/stripe/strip_helper';

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

    // // Step 3: Calculate Proration
    // const prorationDate = Math.floor(Date.now() / 1000);

    // // Step 4: Update Subscription
    // const updatedSubscription = await stripe.subscriptions.update(
    //   subscriptionId,
    //   {
    //     items: [
    //       {
    //         id: subscription.items.data[0].id,
    //         price: newPlanId,
    //       },
    //     ],
    //     proration_behavior: 'create_prorations',
    //     proration_date: prorationDate,
    //   },
    // );

    // Step 5: Notify User
    // In a real-world application, you might send an email or in-app notification here
    // For this example, we'll just return the updated subscription details
    return new Response(JSON.stringify({ subscription: subscription }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

export default handler;
