import {
  TeacherSettings,
  TeacherSettingsInPortal,
} from '@/types/teacher-settings';

import { getAdminSupabaseClient } from '../supabase';

const supabase = getAdminSupabaseClient();

export async function getTeacherSettingsForStudent(
  student_profile_id: string,
): Promise<TeacherSettings> {
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

  // Step 2: Get the teacher settings by teacher profile id and filter out
  const { data, error } = await supabase
    .from('teacher_settings')
    .select(
      'allow_student_use_line, hidden_chateverywhere_default_character_prompt',
    )
    .eq('teacher_profile_id', teacher_profile_id);

  if (error) {
    console.log(error);
    throw error;
  }
  if (!data?.length) {
    console.log('No teacher settings found for the teacher profile id');
    throw new Error('No teacher settings found for the teacher profile id');
  }

  return data[0];
}
export async function getTeacherSettings(
  teacher_profile_id: string,
): Promise<TeacherSettingsInPortal> {
  let { data, error } = await supabase
    .from('teacher_settings')
    .select(
      'allow_student_use_line, hidden_chateverywhere_default_character_prompt, should_clear_conversations_on_logout',
    )
    .eq('teacher_profile_id', teacher_profile_id);

  if (!data?.length) {
    const { data: newData, error: insertError } = await supabase
      .from('teacher_settings')
      .insert([
        {
          teacher_profile_id,
          allow_student_use_line: false,
          hidden_chateverywhere_default_character_prompt: false,
          should_clear_conversations_on_logout: false,
        },
      ])
      .select(
        'allow_student_use_line, hidden_chateverywhere_default_character_prompt, should_clear_conversations_on_logout',
      );

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
    hidden_chateverywhere_default_character_prompt:
      data[0].hidden_chateverywhere_default_character_prompt,
    should_clear_conversations_on_logout:
      data[0].should_clear_conversations_on_logout,
  };
}

export async function updateTeacherSettings(
  teacher_profile_id: string,
  settings: TeacherSettingsInPortal,
): Promise<TeacherSettingsInPortal> {
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
