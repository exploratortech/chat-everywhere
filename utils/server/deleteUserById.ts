import { getAdminSupabaseClient } from './supabase';

export async function deleteUserById(id: string) {
  // delete profile first
  const supabase = getAdminSupabaseClient();
  const { error: deleteProfileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);
  if (deleteProfileError) {
    console.error({ deleteProfileError });
    throw deleteProfileError;
  }
  // finally delete supabase user
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) {
    console.error({ supabaseDeleteErrer: error });
    throw error;
  }
  return true;
}
