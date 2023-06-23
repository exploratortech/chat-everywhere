import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServerRoleKey = process.env.SUPABASE_SERVER_ROLE_KEY || '';

export default async function updateUserAccount(
  userId: string | null,
  stripeSubscriptionId: string,
  upgrade: boolean,
  proPlanExpirationDate?: Date,
) {
  const supabase = createClient(supabaseUrl, supabaseServerRoleKey);

  let error = null;

  if (upgrade) {
    // Update user account
    const { error: updatedUserError } = await supabase
      .from('profiles')
      .update({
        plan: 'pro',
        stripe_subscription_id: stripeSubscriptionId,
        pro_plan_expiration_date: proPlanExpirationDate,
      })
      .eq('id', userId);
    error = updatedUserError;
  } else {
    // Downgrade user account
    const { error: updatedUserError } = await supabase
      .from('profiles')
      .update({
        plan: 'free',
      })
      .eq('stripe_subscription_id', stripeSubscriptionId);
    error = updatedUserError;
  }

  if (error) throw error;

  if (upgrade) {
    console.log(`User ${userId} updated to pro`);
  } else {
    console.log(
      `User subscription ${stripeSubscriptionId} downgrade back to free`,
    );
  }
}
