import { PaidPlan } from '@/types/paid_plan';

import { getAdminSupabaseClient } from '../supabase';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Stripe from 'stripe';

dayjs.extend(utc);

const supabase = getAdminSupabaseClient();

export async function fetchSubscriptionIdByUserId(
  userId: string,
): Promise<string> {
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', userId)
    .single();
  return userProfile?.stripe_subscription_id;
}

export async function getCustomerEmailByCustomerID(
  customerID: string,
): Promise<string> {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2022-11-15',
    });

    // We get the customer id from webhook, so we know the customer is not deleted
    const customer = (await stripe.customers.retrieve(
      customerID,
    )) as Stripe.Customer;
    if (!customer.email) {
      throw new Error(
        `the customer does not have an email, customer id is ${customerID}`,
      );
    }
    return customer.email;
  } catch (e) {
    throw new Error(`getCustomerEmailByCustomerID failed: ${e}`);
  }
}

export async function updateUserAccountById({
  userId,
  plan,
  stripeSubscriptionId,
  proPlanExpirationDate,
}: {
  userId: string;
  plan?: string;
  stripeSubscriptionId?: string;
  proPlanExpirationDate?: Date;
}) {
  // Update user account by User ID
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single();

  if (userProfile?.plan === 'edu') return;

  const { error: updatedUserError } = await supabase
    .from('profiles')
    .update({
      plan,
      stripe_subscription_id: stripeSubscriptionId,
      pro_plan_expiration_date: proPlanExpirationDate,
    })
    .eq('id', userId);
  if (updatedUserError) throw updatedUserError;
  console.log(`User ${userId} updated to ${plan}`);
}

export async function updateUserAccountByEmail({
  email,
  plan,
  stripeSubscriptionId,
  proPlanExpirationDate,
}: {
  email: string;
  plan?: string;
  stripeSubscriptionId?: string;
  proPlanExpirationDate?: Date;
}) {
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('email', email)
    .single();

  if (userProfile?.plan === 'edu') return;

  const { error: updatedUserError } = await supabase
    .from('profiles')
    .update({
      plan,
      stripe_subscription_id: stripeSubscriptionId,
      pro_plan_expiration_date: proPlanExpirationDate,
    })
    .eq('email', email);
  if (updatedUserError) throw updatedUserError;
  console.log(`User ${email} updated to ${plan}`);
}

export async function downgradeUserAccount({
  email,
  stripeSubscriptionId,
}: {
  email?: string;
  stripeSubscriptionId?: string;
}) {
  if (!email && !stripeSubscriptionId) {
    throw new Error('Either email or stripeSubscriptionId must be provided');
  }

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('plan')
    .eq(
      stripeSubscriptionId ? 'stripe_subscription_id' : 'email',
      stripeSubscriptionId || email,
    )
    .single();

  if (userProfile?.plan === 'edu') return;

  const { error: updatedUserError } = await supabase
    .from('profiles')
    .update({
      plan: 'free',
    })
    .eq(
      stripeSubscriptionId ? 'stripe_subscription_id' : 'email',
      stripeSubscriptionId || email,
    );
  if (updatedUserError) throw updatedUserError;
  console.log(`User ${email || stripeSubscriptionId} downgraded to free plan`);
}

export async function extendMembershipByStripeSubscriptionId({
  stripeSubscriptionId,
  proPlanExpirationDate,
}: {
  stripeSubscriptionId: string;
  proPlanExpirationDate: Date;
}) {
  // Extend pro / ultra plan
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('plan, email')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .single();

  if (userProfile?.plan === 'edu') return;

  const { error: updatedUserError } = await supabase
    .from('profiles')
    .update({
      pro_plan_expiration_date: proPlanExpirationDate,
    })
    .eq('stripe_subscription_id', stripeSubscriptionId);
  if (updatedUserError) throw updatedUserError;
  console.log(
    `User ${userProfile?.email} with plan ${userProfile?.plan} extended to ${proPlanExpirationDate}`,
  );
}

export async function calculateMembershipExpirationDate(
  planGivingWeeks: string | undefined,
  planCode: string | undefined,
  sessionCreatedDate: Date,
): Promise<Date | undefined> {
  const previousDate = dayjs(sessionCreatedDate || undefined);
  // If has planGivingWeeks, use it to calculate the expiration date
  if (planGivingWeeks && typeof planGivingWeeks === 'string') {
    return previousDate.add(+planGivingWeeks, 'week').toDate();
  }
  // else extend the expiration date based on the plan code
  else if (planCode === PaidPlan.ProOneTime) {
    return previousDate.add(1, 'month').toDate();
  } else if (planCode === PaidPlan.ProMonthly) {
    return previousDate.add(1, 'month').toDate();
  } else if (planCode === PaidPlan.UltraOneTime) {
    return previousDate.add(1, 'month').toDate();
  } else if (planCode === PaidPlan.UltraMonthly) {
    return previousDate.add(1, 'month').toDate();
  } else if (planCode === PaidPlan.UltraYearly) {
    return previousDate.add(1, 'year').toDate();
  }
  // Return undefined if no conditions are met
  return undefined;
}
