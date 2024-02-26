import { TeacherPrompt } from '@/types/prompt';

import { getAdminSupabaseClient } from '../supabase';

const supabase = getAdminSupabaseClient();

export async function getTeacherPrompt(
  teacher_profile_id: string,
): Promise<TeacherPrompt[]> {
  const res = await supabase
    .from('teacher_prompts')
    .select('*')
    .eq('teacher_profile_id', teacher_profile_id);

  if (res.error) {
    console.log(res.error);
    throw res.error;
  }

  return res.data;
}
