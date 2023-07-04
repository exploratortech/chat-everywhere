import { UserProfile } from '@/types/user';

import dayjs from 'dayjs';
import { Resend } from 'resend';
import Stripe from 'stripe';

const resend = new Resend(process.env.RESEND_EMAIL_API_KEY);
const receiverEmail = process.env.RESEND_EMAIL_RECEIVER!;

export async function sendReport(subject = '', html = '') {
  await resend.emails.send({
    // TODO: need to change this to a verified email domain
    from: 'report@resend.dev',
    to: receiverEmail,
    subject,
    html,
  });
}

export async function sendReportForStripeWebhookError(
  subject = '',
  event: Stripe.Event,
  user?: UserProfile,
) {
  const session = event.data.object as Stripe.Checkout.Session;
  const stripeSubscriptionId = session.subscription as string;
  const paymentDateInCanadaTime = dayjs
    .tz(session.created * 1000, 'America/Toronto')
    .format('YYYY-MM-DD HH:mm:ss');
  const paymentDateInTaiwanTime = dayjs
    .tz(session.created * 1000, 'Asia/Taipei')
    .format('YYYY-MM-DD HH:mm:ss');
  const paymentDateHTML = `
  <p>Stripe Session Date(payment date): ${paymentDateInCanadaTime} (Canada Time)</p>
  <p>Stripe Session Date(payment date): ${paymentDateInTaiwanTime} (Taiwan Time)</p>
  `;

  const userDataHTML = user
    ? `
  <p>User id: ${user?.id}</p>
  <p>User Email: ${user?.email}</p>
  `
    : '';
  const referenceDataHTML = session
    ? `
  <p>Stripe Session Reference</p>
  <pre>
  ${JSON.stringify(session)}
</pre>`
    : `
<p>Stripe Event</p>
<pre>
${JSON.stringify(event)}
</pre>
`;
  await sendReport(
    `Stripe Webhook Error - ${subject}`,
    `
    <p>Stripe Webhook Error - ${subject}</p>
    <p>Stripe Session Id: ${session.id}</p>
    ${paymentDateHTML}
    <p>Stripe event type : ${event.type}</p>
    <p>Stripe Strip Subscription Id: ${stripeSubscriptionId}</p>
    ${userDataHTML}
    ${referenceDataHTML}
    `,
  );
}
