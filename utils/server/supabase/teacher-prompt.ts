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

  for (const prompt of res.data) {
    prompt.model = JSON.parse(prompt.model);
  }
  return res.data;
}

export async function updateTeacherPrompt(
  teacher_profile_id: string,
  prompt: Partial<TeacherPrompt>,
): Promise<boolean> {
  const { error } = await supabase
    .from('teacher_prompts')
    .update({
      ...prompt,
      model: JSON.stringify(prompt.model),
    })
    .eq('teacher_profile_id', teacher_profile_id)
    .eq('id', prompt.id);

  if (error) {
    console.log(error);
    throw error;
  }

  return true;
}

export async function removeTeacherPrompt(
  teacher_profile_id: string,
  prompt_id: string,
) {
  const { error } = await supabase
    .from('teacher_prompts')
    .delete()
    .eq('teacher_profile_id', teacher_profile_id)
    .eq('id', prompt_id);

  if (error) {
    console.log(error);
    throw error;
  }

  return true;
}

export async function createTeacherPrompt(
  teacher_profile_id: string,
  prompt: TeacherPrompt,
) {
  const { data, error } = await supabase
    .from('teacher_prompts')
    .insert({ ...prompt, teacher_profile_id })
    .select();

  if (error) {
    console.log(error);
    throw error;
  }

  return data;
}
