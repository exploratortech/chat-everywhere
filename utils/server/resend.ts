import { UserProfile } from '@/types/user';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { Resend } from 'resend';
import Stripe from 'stripe';

dayjs.extend(utc);
dayjs.extend(timezone);

const isProd = process.env.VERCEL_ENV === 'production';
const resend = new Resend(process.env.RESEND_EMAIL_API_KEY);

export async function sendReport(subject = '', html = '') {
  try {
    const emails = [
      {
        from: 'team@chateverywhere.app',
        to: 'derek@exploratorlabs.com',
        subject,
        html,
      },
    ];
    if (isProd) {
      emails.push({
        from: 'team@chateverywhere.app',
        to: 'jack@exploratorlabs.com',
        subject,
        html,
      });
    }

    await resend.batch.send(emails);
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      throw new Error(`sendReport failed: ${error.message}`);
    }
    throw new Error(`sendReport failed: ${error}`);
  }
}

export async function sendReportForStripeWebhookError(
  subject = '',
  event: Stripe.Event,
  user?: UserProfile,
  cause?: any,
) {
  const session = event.data.object as Stripe.Checkout.Session;
  const stripeSubscriptionId = session.subscription as string;

  const formatDate = (timestamp: number, timezone: string) =>
    dayjs.tz(timestamp * 1000, timezone).format('YYYY-MM-DD HH:mm:ss');

  const paymentDateInCanadaTime = formatDate(
    session.created,
    'America/Toronto',
  );
  const paymentDateInTaiwanTime = formatDate(session.created, 'Asia/Taipei');

  const paymentDateHTML = `
    <p>Stripe Session Date(payment date): ${paymentDateInCanadaTime} (Canada Time)</p>
    <p>Stripe Session Date(payment date): ${paymentDateInTaiwanTime} (Taiwan Time)</p>
  `;

  const userDataHTML = user
    ? `
      <p>User id: ${user.id}</p>
      <p>User Email: ${user.email}</p>
    `
    : '';

  const referenceDataHTML = session
    ? `
      <p>Stripe Session Reference</p>
      <pre>${JSON.stringify(session, null, 2)}</pre>
      <p>Cause data</p>
      <pre>${JSON.stringify(cause, null, 2)}</pre>
    `
    : `
      <p>Stripe Event</p>
      <pre>${JSON.stringify(event, null, 2)}</pre>
      <p>Cause data</p>
      <pre>${JSON.stringify(cause, null, 2)}</pre>
    `;

  const emailHTML = `
    <p>Stripe Webhook Error - ${subject}</p>
    <p>Stripe Session Id: ${session.id}</p>
    ${paymentDateHTML}
    <p>Stripe event type: ${event.type}</p>
    <p>Stripe Subscription Id: ${stripeSubscriptionId}</p>
    ${userDataHTML}
    ${referenceDataHTML}
  `;

  await sendReport(`Stripe Webhook Error - ${subject}`, emailHTML);
}
