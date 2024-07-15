import {
  downgradeUserAccount,
  getCustomerEmailByCustomerID,
} from './strip_helper';

import Stripe from 'stripe';
import { TEST_PAYMENT_USER } from '@/cypress/e2e/account';

export default async function handleCustomerSubscriptionDeleted(
  session: Stripe.Subscription,
  isFakeEvent = false,
): Promise<void> {
  if (isFakeEvent) {
    await downgradeUserAccount({
      email: TEST_PAYMENT_USER.email,
    });
    return
  }
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
