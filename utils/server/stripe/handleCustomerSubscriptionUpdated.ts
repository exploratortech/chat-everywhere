import getCustomerEmailByCustomerID from './getCustomerEmailByCustomerID';
import updateUserAccount from './updateUserAccount';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Stripe from 'stripe';

dayjs.extend(utc);

export default async function handleCustomerSubscriptionUpdated(
  session: Stripe.Subscription,
): Promise<void> {
  const stripeSubscriptionId = session.id;

  if (!session.cancel_at) {
    return;
  }

  const cancelAtDate = dayjs.unix(session.cancel_at!).utc().toDate();
  const today = dayjs().utc().toDate();

  if (cancelAtDate < today) {
    // Downgrade to free plan
    if (!stripeSubscriptionId) {
      const customerId = session.customer as string;
      const email = await getCustomerEmailByCustomerID(customerId);
      await updateUserAccount({
        upgrade: false,
        email,
      });
    } else {
      await updateUserAccount({
        upgrade: false,
        stripeSubscriptionId,
      });
    }
  } else {
    // Replace the Pro plan expiration date with the cancel_at date
    if (stripeSubscriptionId) {
      await updateUserAccount({
        upgrade: false,
        extending: true,
        stripeSubscriptionId,
        proPlanExpirationDate: cancelAtDate,
      });
    }
  }
}
