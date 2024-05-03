import {
  fetchUserProfileWithAccessToken,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { updateTeacherSettings } from '@/utils/server/supabase/teacher-settings';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), {
      status: 405,
    });
  }
  const userProfile = await fetchUserProfileWithAccessToken(req);
  if (!userProfile || !userProfile.isTeacherAccount)
    return unauthorizedResponse;

  // Parse the request body to get the settings
  const requestData = await req.json();
  const settings = requestData.settings;

  console.log({
    settings,
  });
  return new Response(
    JSON.stringify({
      isSuccess: await updateTeacherSettings(userProfile.id, settings),
    }),
    { status: 200 },
  );
};
export default handler;
