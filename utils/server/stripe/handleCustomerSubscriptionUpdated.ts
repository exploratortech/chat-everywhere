import {
  downgradeUserAccount,
  extendMembershipByStripeSubscriptionId,
  getCustomerEmailByCustomerID,
} from './strip_helper';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Stripe from 'stripe';

dayjs.extend(utc);

export default async function handleCustomerSubscriptionUpdated(
  session: Stripe.Subscription,
): Promise<void> {
  const stripeSubscriptionId = session.id;

  const currentPeriodStart = dayjs
    .unix(session.current_period_start)
    .utc()
    .toDate();
  const currentPeriodEnd = dayjs
    .unix(session.current_period_end)
    .utc()
    .toDate();

  console.log({
    currentPeriodStart,
    currentPeriodEnd,
  });
  const cancelAtDate = session.cancel_at
    ? dayjs.unix(session.cancel_at).utc().toDate()
    : null;
  const today = dayjs().utc().toDate();

  if (cancelAtDate && cancelAtDate < today) {
    // Downgrade to free plan
    if (!stripeSubscriptionId) {
      const customerId = session.customer as string;
      const email = await getCustomerEmailByCustomerID(customerId);
      await downgradeUserAccount({
        email,
      });
    } else {
      await downgradeUserAccount({
        stripeSubscriptionId,
      });
    }
  } else {
    // Monthly Pro / Ultra Plan Subscription recurring payment, extend expiration date
    if (!stripeSubscriptionId) {
      throw new Error('Stripe subscription ID not found');
    } else {
      await extendMembershipByStripeSubscriptionId({
        stripeSubscriptionId,
        proPlanExpirationDate: currentPeriodEnd,
      });
    }
  }
}
