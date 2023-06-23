import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServerRoleKey = process.env.SUPABASE_SERVER_ROLE_KEY || '';

export default async function updateUserAccount(props: UpdateUserAccountProps) {
  const supabase = createClient(supabaseUrl, supabaseServerRoleKey);

  if (isUpgradeUserAccountProps(props)) {
    // Update user account
    const { error: updatedUserError } = await supabase
      .from('profiles')
      .update({
        plan: 'pro',
        stripe_subscription_id: props.stripeSubscriptionId,
        pro_plan_expiration_date: props.proPlanExpirationDate,
      })
      .eq('id', props.userId);

    if (updatedUserError) throw updatedUserError;
    console.log(`User ${props.userId} updated to pro`);
  } else if (isDowngradeUserAccountProps(props)) {
    // Downgrade user account
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
  } else if (isExtendProPlanProps(props)) {
    // Extend pro plan
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
  stripeSubscriptionId?: string;
  proPlanExpirationDate: Date;
}

interface DowngradeUserAccountProps {
  upgrade: false;
  stripeSubscriptionId: string;
  proPlanExpirationDate?: Date;
}

interface ExtendProPlanProps {
  upgrade: true;
  stripeSubscriptionId: string;
  proPlanExpirationDate: Date;
}

type UpdateUserAccountProps =
  | UpgradeUserAccountProps
  | DowngradeUserAccountProps
  | ExtendProPlanProps;

// Type Assertion functions
function isUpgradeUserAccountProps(
  props: UpdateUserAccountProps,
): props is UpgradeUserAccountProps {
  return (
    props.upgrade === true &&
    'userId' in props &&
    typeof props.userId === 'string' &&
    props.proPlanExpirationDate instanceof Date
  );
}

function isDowngradeUserAccountProps(
  props: UpdateUserAccountProps,
): props is DowngradeUserAccountProps {
  return (
    props.upgrade === false &&
    typeof props.stripeSubscriptionId === 'string' &&
    (props.proPlanExpirationDate === undefined ||
      props.proPlanExpirationDate instanceof Date)
  );
}

function isExtendProPlanProps(
  props: UpdateUserAccountProps,
): props is ExtendProPlanProps {
  return (
    props.upgrade === true &&
    typeof props.stripeSubscriptionId === 'string' &&
    props.proPlanExpirationDate instanceof Date
  );
}
