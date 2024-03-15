import {
  fetchUserProfileWithAccessToken,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { getTeacherSettingsForStudent } from '@/utils/server/supabase/teacher-settings';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  const userProfile = await fetchUserProfileWithAccessToken(req);
  if (!userProfile || !userProfile.isTempUser) return unauthorizedResponse;

  try {
    return new Response(
      JSON.stringify({
        settings: await getTeacherSettingsForStudent(userProfile.id),
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
