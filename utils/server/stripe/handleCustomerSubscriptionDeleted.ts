import getCustomerEmailByCustomerID from './getCustomerEmailByCustomerID';
import updateUserAccount from './updateUserAccount';

import type Stripe from 'stripe';

export default async function handleCustomerSubscriptionDeleted(
  session: Stripe.Subscription,
): Promise<void> {
  const stripeSubscriptionId = session.id;

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
}
