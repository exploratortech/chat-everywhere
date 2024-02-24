import {
  fetchUserProfileWithAccessToken,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { getTeacherTags } from '@/utils/server/supabase/tags';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  const userProfile = await fetchUserProfileWithAccessToken(req);
  if (!userProfile || !userProfile.isTeacherAccount)
    return unauthorizedResponse;

  return new Response(
    JSON.stringify({
      tags: await getTeacherTags(userProfile.id),
    }),
    { status: 200 },
  );
};
export default handler;
