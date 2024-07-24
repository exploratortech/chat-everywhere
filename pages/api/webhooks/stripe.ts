import type { NextApiRequest, NextApiResponse } from 'next';

import { sendReportForStripeWebhookError } from '@/utils/server/resend';
import handleCheckoutSessionCompleted from '@/utils/server/stripe/handleCheckoutSessionCompleted';
import handleCustomerSubscriptionDeleted from '@/utils/server/stripe/handleCustomerSubscriptionDeleted';
import handleCustomerSubscriptionUpdated from '@/utils/server/stripe/handleCustomerSubscriptionUpdated';

import type { UserProfile } from './../../../types/user';

import getRawBody from 'raw-body';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  let isFakeEvent = false;
  const isProd = process.env.VERCEL_ENV === 'production';

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  // Read the raw body
  const rawBody = await getRawBody(req);

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const bodyData = JSON.parse(rawBody.toString());
    // The fakeEvent is only available in the non-prod environment, its used by Cypress `api/cypress/test-subscription-plan-payment`
    if (!isProd && bodyData.fakeEvent) {
      event = bodyData.fakeEvent;
      isFakeEvent = true;
    } else {
      console.error(
        `Webhook signature verification failed.`,
        (err as any).message,
      );
      return res.status(400).send(`Webhook signature verification failed.`);
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        // One time payment / Initial Monthly [Pro / Ultra] Plan Subscription / Top Up Request
        console.log('✅ checkout.session.completed');
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
          isFakeEvent,
        );
        break;
      case 'customer.subscription.updated':
        // Monthly Pro / Ultra Plan Subscription recurring payment
        console.log('✅ customer.subscription.updated');
        await handleCustomerSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'customer.subscription.deleted':
        // Monthly Pro Plan Subscription removal
        console.log('✅ customer.subscription.deleted');
        await handleCustomerSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
          isFakeEvent,
        );
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    res.json({ received: true });
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      const user =
        error.cause && typeof error.cause === 'object' && 'user' in error.cause
          ? (error.cause.user as UserProfile)
          : undefined;

      try {
        await sendReportForStripeWebhookError(
          error.message,
          event,
          user,
          error.cause,
        );
      } catch (error) {
        console.error(error);
        throw error;
      }
      return res.json({ received: true, error: error.message });
    }
    throw error;
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
