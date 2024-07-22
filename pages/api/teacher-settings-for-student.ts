import {
  fetchUserProfileWithAccessToken,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { getTeacherSettingsForStudent } from '@/utils/server/supabase/teacher-settings';

import type { TeacherSettings } from '@/types/teacher-settings';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  const userProfile = await fetchUserProfileWithAccessToken(req);
  if (!userProfile || !userProfile.isTempUser) return unauthorizedResponse;

  const teacherSettingsRes = await getTeacherSettingsForStudent(userProfile.id);
  let teacherSettings: TeacherSettings;
  if (!teacherSettingsRes) {
    teacherSettings = {
      allow_student_use_line: false,
      hidden_chateverywhere_default_character_prompt: false,
    };
  } else {
    teacherSettings = teacherSettingsRes;
  }

  try {
    return new Response(
      JSON.stringify({
        settings: teacherSettings,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return new Response('Error', {
      status: 500,
      statusText: 'Internal server error',
    });
  }
};
export default handler;
