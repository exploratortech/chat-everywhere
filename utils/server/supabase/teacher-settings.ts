import { TeacherSettings } from '@/types/teacher-settings';

import { getAdminSupabaseClient } from '../supabase';

const supabase = getAdminSupabaseClient();

export async function getTeacherSettings(
  teacher_profile_id: string,
): Promise<TeacherSettings> {
  let { data, error } = await supabase
    .from('teacher_settings')
    .select('allow_student_use_line')
    .eq('teacher_profile_id', teacher_profile_id);

  if (!data?.length) {
    const { data: newData, error: insertError } = await supabase
      .from('teacher_settings')
      .insert([{ teacher_profile_id, allow_student_use_line: false }])
      .select('allow_student_use_line');

    if (insertError) {
      throw insertError;
    }

    data = newData;
  } else if (error) {
    throw error;
  }

  if (!data.length) {
    throw new Error('No teacher settings found');
  }
  return {
    allow_student_use_line: data[0].allow_student_use_line,
  };
}

export async function updateTeacherSettings(
  teacher_profile_id: string,
  settings: TeacherSettings,
): Promise<TeacherSettings> {
  const { data, error } = await supabase
    .from('teacher_settings')
    .update(settings)
    .eq('teacher_profile_id', teacher_profile_id)
    .single();
  if (error) {
    throw error;
  }
  return data;
}
