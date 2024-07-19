import { getAdminSupabaseClient } from '../supabase';
import { getCustomerEmailByCustomerID } from './strip_helper';

import { TEST_PAYMENT_USER } from '@/cypress/e2e/account';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type Stripe from 'stripe';

const supabase = getAdminSupabaseClient();
dayjs.extend(utc);

export default async function handleCustomerSubscriptionDeleted(
  session: Stripe.Subscription,
  isFakeEvent = false,
): Promise<void> {
  // Add 1 day to the current date to avoid time zone differences

  if (isFakeEvent) {
    const { error: updatedUserError } = await supabase
      .from('profiles')
      .update({
        pro_plan_expiration_date: dayjs()
          .add(1, 'month')
          .add(1, 'day')
          .utc()
          .toDate(),
      })
      .eq('email', TEST_PAYMENT_USER.email);
    if (updatedUserError) throw updatedUserError;
    return;
  }

  const newExpirationDate = dayjs
    .unix(session.current_period_end)
    .add(1, 'day')
    .utc()
    .toDate();
  const stripeSubscriptionId = session.id;

  if (!stripeSubscriptionId) {
    const customerId = session.customer as string;
    const email = await getCustomerEmailByCustomerID(customerId);
    const { error: updatedUserError } = await supabase
      .from('profiles')
      .update({
        pro_plan_expiration_date: newExpirationDate,
      })
      .eq('email', email);
    if (updatedUserError) throw updatedUserError;
  } else {
    const { error: updatedUserError } = await supabase
      .from('profiles')
      .update({
        pro_plan_expiration_date: newExpirationDate,
      })
      .eq('stripe_subscription_id', stripeSubscriptionId);
    if (updatedUserError) throw updatedUserError;
  }
}
