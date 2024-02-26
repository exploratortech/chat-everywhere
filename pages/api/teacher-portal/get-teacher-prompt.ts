import {
  fetchUserProfileWithAccessToken,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { getTeacherPrompt } from '@/utils/server/supabase/teacher-prompt';

import { Prompts } from './../../../components/Promptbar/components/Prompts';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  const userProfile = await fetchUserProfileWithAccessToken(req);
  if (!userProfile || !userProfile.isTeacherAccount)
    return unauthorizedResponse;

  return new Response(
    JSON.stringify({
      prompts: await getTeacherPrompt(userProfile.id),
    }),
    { status: 200 },
  );
};
export default handler;
