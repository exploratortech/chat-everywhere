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

export async function updateTeacherPrompt(
  teacher_profile_id: string,
  prompt: Partial<TeacherPrompt>,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('teacher_prompts')
    .update(prompt)
    .eq('teacher_profile_id', teacher_profile_id)
    .eq('id', prompt.id);

  if (error) {
    console.log(error);
    throw error;
  }

  return data ? true : false;
}
