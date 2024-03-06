import { getAdminSupabaseClient } from '../supabase';
const supabase = getAdminSupabaseClient();

export async function removeSharedMessagesWithTeacher
    (
  teacher_profile_id: string,
  message_ids: string[],
) {
  const { error } = await supabase
    .from('student_message_submissions')
    .delete()
    .eq('teacher_profile_id', teacher_profile_id)
    .in('id', message_ids);

  if (error) {
    console.log(error);
    throw error;
  }

  return true;
}