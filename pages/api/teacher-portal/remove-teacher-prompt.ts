import {
  fetchUserProfileWithAccessToken,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { removeTeacherPrompt } from '@/utils/server/supabase/teacher-prompt';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  // check method
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const userProfile = await fetchUserProfileWithAccessToken(req);
  if (!userProfile || !userProfile.isTeacherAccount)
    return unauthorizedResponse;
  // check if the prompt id is provided from body
  const requestBody = (await req.json()) as {
    prompt_id: string;
  };
  const promptId = requestBody?.prompt_id;
  if (!promptId) {
    return new Response('No prompt id provided', { status: 400 });
  }

  try {
    return new Response(
      JSON.stringify({
        is_removed: await removeTeacherPrompt(userProfile.id, promptId),
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
