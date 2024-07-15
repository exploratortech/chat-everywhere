import {
  fetchUserProfileWithAccessToken,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { createTeacherPrompt } from '@/utils/server/supabase/teacher-prompt';

import type { TeacherPromptForTeacherPortal } from '@/types/prompt';

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
  const { prompt } = requestBody;

  if (!prompt) {
    return new Response('No prompt provided', { status: 400 });
  }
  const formattedPrompt = {
    name: prompt.name,
    description: prompt.description,
    content: prompt.content,
    is_enable: prompt.is_enable,
    model: prompt.model.id,
    default_mode: prompt.default_mode,
    first_message_to_gpt: prompt.first_message_to_gpt,
    teacher_profile_id: userProfile.id,
  };

  try {
    return new Response(
      JSON.stringify({
        is_updated: await createTeacherPrompt({
          ...formattedPrompt,
        }),
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
