import {
  fetchUserProfileWithAccessToken,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { getTeacherSettings } from '@/utils/server/supabase/teacher-settings';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  const userProfile = await fetchUserProfileWithAccessToken(req);
  if (!userProfile || !userProfile.isTeacherAccount)
    return unauthorizedResponse;

  return new Response(
    JSON.stringify({
      settings: await getTeacherSettings(userProfile.id),
    }),
    { status: 200 },
  );
};
export default handler;
