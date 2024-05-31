import { STRIPE_PRODUCT_LIST } from '@/utils/app/stripe_config';

import { PaidPlan } from '@/types/paid_plan';

import { getAdminSupabaseClient } from '../supabase';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Stripe from 'stripe';

dayjs.extend(utc);

const supabase = getAdminSupabaseClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

async function getSubscriptionById(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw error;
  }
}
const StripeHelper = {
  subscription: {
    getSubscriptionById,
  },
  product: {
    getProductByCheckoutSessionId: getProductByCheckoutSessionId,
    getProductByProductId: getProductByProductId,
  },
};
export default StripeHelper;

async function getProductByCheckoutSessionId(
  sessionId: string,
  mode: Stripe.Checkout.Session.Mode,
) {
  const productId = await getProductIdByCheckoutSessionId(sessionId);
  return getProductByProductId(productId, mode);
}
async function getProductByProductId(
  productId: string,
  mode: Stripe.Checkout.Session.Mode,
) {
  const product = STRIPE_PRODUCT_LIST.find(
    (product) => product.productId === productId && product.mode === mode,
  );
  if (!product) {
    throw new Error('The product id does not exist in our codebase', {
      cause: {
        productId,
      },
    });
  }
  return product;
}

async function getProductIdByCheckoutSessionId(
  sessionId: string,
): Promise<string> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items'],
  });
  const lineItems = session.line_items;

  const productId = lineItems?.data[0]?.price?.product;
  if (!productId || typeof productId !== 'string') {
    throw new Error('The session does not have a product id', {
      cause: {
        session,
      },
    });
  }
  return productId;
}

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
