import { getAdminSupabaseClient } from '../supabase';
import StripeHelper, {
  downgradeUserAccount,
  getCustomerEmailByCustomerID,
} from './strip_helper';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Stripe from 'stripe';

const supabase = getAdminSupabaseClient();
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
    // Monthly Pro / Ultra Plan Subscription recurring payment, extend expiration date / change to new plan
    if (!stripeSubscriptionId) {
      throw new Error('Stripe subscription ID not found');
    }

    const userSubscription =
      await StripeHelper.subscription.getSubscriptionById(stripeSubscriptionId);
    const productId = userSubscription.items.data[0].price.product;
    if (!productId || typeof productId !== 'string') {
      throw new Error('The session does not have a product id', {
        cause: {
          session,
        },
      });
    }
    const product = await StripeHelper.product.getProductByProductId(productId);
    if (product.type !== 'paid_plan') return;
    const { error: updatedUserError } = await supabase
      .from('profiles')
      .update({
        plan: product.productValue,
        pro_plan_expiration_date: currentPeriodEnd,
      })
      .eq('stripe_subscription_id', stripeSubscriptionId);
    if (updatedUserError) throw updatedUserError;
  }
}
