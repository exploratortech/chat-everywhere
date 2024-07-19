import type { TeacherPromptForTeacherPortal } from '@/types/prompt';
import type { Database } from '@/types/supabase';

import { getAdminSupabaseClient } from '../supabase';

const supabase = getAdminSupabaseClient();

export async function getTeacherPromptForTeacher(teacher_profile_id: string) {
  const promptsRes = await supabase
    .from('teacher_prompts')
    .select('*')
    .eq('teacher_profile_id', teacher_profile_id)
    .eq('is_enable', true);

  if (promptsRes.error) {
    console.log(promptsRes.error);
    throw promptsRes.error;
  }

  return promptsRes.data;
}
export async function getTeacherPromptForStudent(student_profile_id: string) {
  // Step 1: Locate teacher profile id by getting the temp profile by student profile id
  // with join on one time code table to get the teacher profile id
  const tempProfileRes = await supabase
    .from('temporary_account_profiles')
    .select('one_time_codes(teacher_profile_id)')
    .eq('profile_id', student_profile_id)
    .single();

  if (tempProfileRes.error || !tempProfileRes.data) {
    throw tempProfileRes.error;
  }

  if (
    !tempProfileRes.data.one_time_codes ||
    tempProfileRes.data.one_time_codes.length === 0
  ) {
    console.log('No one time code found for the student profile id');
    throw new Error('No one time code found for the student profile id');
  }
  const teacher_profile_id = (tempProfileRes.data.one_time_codes as any)
    .teacher_profile_id;

  // Step 2: Get the teacher prompt by teacher profile id and filter out only the is_enable = true
  return await getTeacherPromptForTeacher(teacher_profile_id);
}
export async function getTeacherPrompt(
  teacher_profile_id: string,
): Promise<TeacherPromptForTeacherPortal[]> {
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
  prompt: Partial<TeacherPromptForTeacherPortal>,
): Promise<boolean> {
  const { error } = await supabase
    .from('teacher_prompts')
    .update(prompt)
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
  prompt: Database['public']['Tables']['teacher_prompts']['Insert'],
) {
  const { data, error } = await supabase
    .from('teacher_prompts')
    .insert({ ...prompt })
    .select();

  if (error) {
    console.log(error);
    throw error;
  }

  return data;
}
