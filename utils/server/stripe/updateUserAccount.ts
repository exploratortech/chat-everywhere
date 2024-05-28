import { SubscriptionPlan } from '@/types/paid_plan';

import { getAdminSupabaseClient } from '../supabase';

// Skip any account operation on Edu accounts
export default async function updateUserAccount(props: UpdateUserAccountProps) {
  const supabase = getAdminSupabaseClient();

  if (isUpgradeUserAccountProps(props)) {
    // Update user account
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', props.userId)
      .single();

    if (userProfile?.plan === 'edu') return;

    const { error: updatedUserError } = await supabase
      .from('profiles')
      .update({
        plan: props.plan,
        stripe_subscription_id: props.stripeSubscriptionId,
        pro_plan_expiration_date: props.proPlanExpirationDate || null,
      })
      .eq('id', props.userId);

    if (updatedUserError) throw updatedUserError;
    console.log(`User ${props.userId} updated to ${props.plan}`);
  } else if (isUpgradeUserAccountByEmailProps(props)) {
    // Update user account by Email
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('email', props.email)
      .single();

    if (userProfile?.plan === 'edu') return;

    const { error: updatedUserError } = await supabase
      .from('profiles')
      .update({
        plan: props.plan,
        stripe_subscription_id: props.stripeSubscriptionId,
        pro_plan_expiration_date: props.proPlanExpirationDate || null,
      })
      .eq('email', props.email);
    if (updatedUserError) throw updatedUserError;
    console.log(`User ${props.email} updated to ${props.plan}`);
  } else if (isDowngradeUserAccountProps(props)) {
    // Downgrade user account

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('stripe_subscription_id', props.stripeSubscriptionId)
      .single();

    if (userProfile?.plan === 'edu') return;

    const { error: updatedUserError } = await supabase
      .from('profiles')
      .update({
        plan: 'free',
      })
      .eq('stripe_subscription_id', props.stripeSubscriptionId);
    if (updatedUserError) throw updatedUserError;
    console.log(
      `User subscription ${props.stripeSubscriptionId} downgrade back to free`,
    );
  } else if (isDowngradeUserAccountByEmailProps(props)) {
    // Downgrade user account
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('email', props.email)
      .single();

    if (userProfile?.plan === 'edu') return;

    const { error: updatedUserError } = await supabase
      .from('profiles')
      .update({
        plan: 'free',
      })
      .eq('email', props.email);
    if (updatedUserError) throw updatedUserError;
    console.log(`User subscription ${props.email} downgrade back to free`);
  } else if (isExtendMembershipProps(props)) {
    // Extend pro / ultra plan
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('stripe_subscription_id', props.stripeSubscriptionId)
      .eq('plan', props.plan)
      .single();

    if (userProfile?.plan === 'edu') return;

    const { error: updatedUserError } = await supabase
      .from('profiles')
      .update({
        pro_plan_expiration_date: props.proPlanExpirationDate,
      })
      .eq('stripe_subscription_id', props.stripeSubscriptionId);
    if (updatedUserError) throw updatedUserError;
    console.log(
      `User subscription ${props.stripeSubscriptionId} extended to ${props.proPlanExpirationDate}`,
    );
  } else {
    throw new Error('Invalid props object');
  }
}

interface UpgradeUserAccountProps {
  upgrade: true;
  userId: string;
  plan: SubscriptionPlan;
  stripeSubscriptionId?: string;
  proPlanExpirationDate?: Date;
}

interface UpgradeUserAccountByEmailProps {
  upgrade: true;
  email: string;
  plan: SubscriptionPlan;
  stripeSubscriptionId?: string;
  proPlanExpirationDate?: Date;
}

interface DowngradeUserAccountProps {
  upgrade: false;
  stripeSubscriptionId: string;
  proPlanExpirationDate?: Date;
}
interface DowngradeUserAccountByEmailProps {
  upgrade: false;
  email: string;
  proPlanExpirationDate?: Date;
}

interface ExtendProPlanProps {
  upgrade: true;
  plan: SubscriptionPlan;
  stripeSubscriptionId: string;
  proPlanExpirationDate: Date | undefined;
}

type UpdateUserAccountProps =
  | UpgradeUserAccountProps
  | UpgradeUserAccountByEmailProps
  | DowngradeUserAccountProps
  | DowngradeUserAccountByEmailProps
  | ExtendProPlanProps;

// Type Assertion functions
function isUpgradeUserAccountProps(
  props: UpdateUserAccountProps,
): props is UpgradeUserAccountProps {
  return (
    props.upgrade === true &&
    'userId' in props &&
    typeof props.userId === 'string' &&
    !!props.plan &&
    (props.proPlanExpirationDate instanceof Date ||
      props.proPlanExpirationDate === undefined)
  );
}

function isUpgradeUserAccountByEmailProps(
  props: UpdateUserAccountProps,
): props is UpgradeUserAccountByEmailProps {
  return (
    props.upgrade === true &&
    'email' in props &&
    typeof props.email === 'string' &&
    !!props.plan &&
    (props.proPlanExpirationDate instanceof Date ||
      props.proPlanExpirationDate === undefined)
  );
}

function isDowngradeUserAccountProps(
  props: UpdateUserAccountProps,
): props is DowngradeUserAccountProps {
  return (
    props.upgrade === false &&
    'stripeSubscriptionId' in props &&
    typeof props.stripeSubscriptionId === 'string' &&
    (props.proPlanExpirationDate === undefined ||
      props.proPlanExpirationDate instanceof Date)
  );
}

function isDowngradeUserAccountByEmailProps(
  props: UpdateUserAccountProps,
): props is DowngradeUserAccountByEmailProps {
  return (
    props.upgrade === false &&
    'email' in props &&
    typeof props.email === 'string' &&
    (props.proPlanExpirationDate === undefined ||
      props.proPlanExpirationDate instanceof Date)
  );
}

function isExtendMembershipProps(
  props: UpdateUserAccountProps,
): props is ExtendProPlanProps {
  return (
    (props.upgrade === true &&
      typeof props.stripeSubscriptionId === 'string' &&
      !!props.plan &&
      props.proPlanExpirationDate instanceof Date) ||
    props.proPlanExpirationDate === undefined
  );
}
