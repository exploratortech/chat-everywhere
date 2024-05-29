import getCustomerEmailByCustomerID, {
  downgradeUserAccount,
} from './strip_helper';

import Stripe from 'stripe';

export default async function handleCustomerSubscriptionDeleted(
  session: Stripe.Subscription,
): Promise<void> {
  const stripeSubscriptionId = session.id;

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
}
