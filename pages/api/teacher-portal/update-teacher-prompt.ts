import {
  fetchUserProfileWithAccessToken,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { updateTeacherPrompt } from '@/utils/server/supabase/teacher-prompt';

import { TeacherPromptForTeacherPortal } from '@/types/prompt';

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

  const requestBody = (await req.json()) as {
    prompt: TeacherPromptForTeacherPortal;
  };
  const prompt = requestBody?.prompt;
  if (!prompt) {
    return new Response('No prompt provided', { status: 400 });
  }

  try {
    return new Response(
      JSON.stringify({
        is_updated: await updateTeacherPrompt(
          userProfile.id,
          requestBody.prompt,
        ),
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
