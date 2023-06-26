import { NextApiRequest, NextApiResponse } from 'next';

import updateUserAccount from '@/utils/server/stripe/updateUserAccount';
import { retrieveUserProfileBy } from '@/utils/server/supabase';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import getRawBody from 'raw-body';
import Stripe from 'stripe';

dayjs.extend(utc);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});
const ONE_TIME_PRO_PLAN_FOR_1_MONTH =
  process.env.STRIPE_PLAN_CODE_ONE_TIME_PRO_PLAN_FOR_1_MONTH;
const MONTHLY_PRO_PLAN_SUBSCRIPTION =
  process.env.STRIPE_PLAN_CODE_MONTHLY_PRO_PLAN_SUBSCRIPTION;

const isUserInEducationPlan = async (
  userId?: string,
  stripeSubscriptionId?: string
) => {
  const userProfile = await retrieveUserProfileBy(
    userId,
    stripeSubscriptionId
  );

  return userProfile.plan === 'edu';
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;
    let stripeSubscriptionId: string | null = null;

    // Read the raw body
    const rawBody = await getRawBody(req);

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      console.error(
        `Webhook signature verification failed.`,
        (err as any).message,
      );
      return res.status(400).send(`Webhook signature verification failed.`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      let userId = session.client_reference_id;
      const customerEmail = session.customer_details?.email || undefined;
      const planCode = session.metadata?.plan_code;
      stripeSubscriptionId = session.subscription as string;

      if(!userId) {
        const userProfile = await retrieveUserProfileBy(
          undefined,
          stripeSubscriptionId,
          customerEmail,
        );
        userId = userProfile.id;
      }

      if (!userId || !planCode) {
        throw new Error('missing User id or plan code from Stripe webhook');
      }

      if (
        (await !isUserInEducationPlan(userId)) &&
        (planCode === ONE_TIME_PRO_PLAN_FOR_1_MONTH ||
          planCode === MONTHLY_PRO_PLAN_SUBSCRIPTION)
      ) {
        const currentDate = dayjs().utc().toDate();
        const proPlanExpirationDateUTC = dayjs(currentDate)
          .add(1, 'month')
          .toDate();
        // upgrading
        await updateUserAccount({
          upgrade: true,
          userId,
          stripeSubscriptionId,
          proPlanExpirationDate: proPlanExpirationDateUTC,
        });
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const session = event.data.object as Stripe.Subscription;
      stripeSubscriptionId = session.id;

      if (!stripeSubscriptionId) {
        console.error(session);
        throw new Error('Subscription id not found from Stripe webhook');
      }

      // Skip if user is in education plan
      if (await isUserInEducationPlan(undefined, stripeSubscriptionId))
        return res.json({ received: true });

      if (!session.cancel_at) {
        return res.json({ received: true });
      }

      const cancelAtDate = dayjs.unix(session.cancel_at!).utc().toDate();
      const today = dayjs().utc().toDate();

      if (cancelAtDate < today) {
        // Downgrade to free plan
        await updateUserAccount({
          upgrade: false,
          stripeSubscriptionId,
        });
      } else {
        // Monthly Pro Plan Subscription recurring payment, extend expiration date
        await updateUserAccount({
          upgrade: true,
          stripeSubscriptionId,
          proPlanExpirationDate: cancelAtDate,
        });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const session = event.data.object as Stripe.Subscription;
      stripeSubscriptionId = session.id;

      // Skip if user is in education plan
      if (await isUserInEducationPlan(undefined, stripeSubscriptionId))
        return res.json({ received: true });

      if (!stripeSubscriptionId) {
        console.error(session);
        throw new Error('Subscription id not found from Stripe webhook');
      }

      await updateUserAccount({
        upgrade: false,
        stripeSubscriptionId,
      });
    }

    // Return a response to acknowledge receipt of the event
    res.json({ received: true });
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
