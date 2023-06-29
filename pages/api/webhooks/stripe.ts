import { NextApiRequest, NextApiResponse } from 'next';

import updateUserAccount from '@/utils/server/stripe/updateUserAccount';

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
      const userId = session.client_reference_id;
      const email = session.customer_details?.email;

      const planCode = session.metadata?.plan_code;
      stripeSubscriptionId = session.subscription as string;

      if (!planCode) {
        throw new Error('plan code from Stripe webhook');
      }

      if (!userId && !email) {
        throw new Error('missing User id and Email from Stripe webhook');
      }

      // Update user account by User id
      if (userId) {
        if (
          planCode === ONE_TIME_PRO_PLAN_FOR_1_MONTH ||
          planCode === MONTHLY_PRO_PLAN_SUBSCRIPTION
        ) {
          const currentDate = dayjs().utc().toDate();
          const proPlanExpirationDateUTC = dayjs(currentDate)
            .add(1, 'month')
            .toDate();

          // Only store expiration for one month plan
          await updateUserAccount({
            upgrade: true,
            userId,
            stripeSubscriptionId,
            proPlanExpirationDate:
              planCode === ONE_TIME_PRO_PLAN_FOR_1_MONTH
                ? proPlanExpirationDateUTC
                : undefined,
          });
        }
      } else {
        // Update user account by Email
        const currentDate = dayjs().utc().toDate();
        const proPlanExpirationDateUTC = dayjs(currentDate)
          .add(1, 'month')
          .toDate();

        // Only store expiration for one month plan
        await updateUserAccount({
          upgrade: true,
          email: email!,
          stripeSubscriptionId,
          proPlanExpirationDate:
            planCode === ONE_TIME_PRO_PLAN_FOR_1_MONTH
              ? proPlanExpirationDateUTC
              : undefined,
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
          proPlanExpirationDate: undefined,
        });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const session = event.data.object as Stripe.Subscription;
      stripeSubscriptionId = session.id;

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
