import {
  fetchUserProfileWithAccessToken,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { updateTeacherPrompt } from '@/utils/server/supabase/teacher-prompt';

import { TeacherPrompt } from '@/types/prompt';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const userProfile = await fetchUserProfileWithAccessToken(req);
  if (!userProfile || !userProfile.isTeacherAccount)
    return unauthorizedResponse;

  // check if the prompt id is provided from body
  const requestBody = (await req.json()) as {
    prompt: TeacherPrompt;
  };
  const promptId = requestBody?.prompt?.id;
  if (!promptId) {
    return new Response('No prompt id provided', { status: 400 });
  }

  return new Response(
    JSON.stringify({
      is_updated: await updateTeacherPrompt(userProfile.id, requestBody.prompt),
    }),
    { status: 200 },
  );
};
export default handler;
