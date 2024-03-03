import {
  fetchUserProfileWithAccessToken,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { removeSharedMessagesWithTeacher } from '@/utils/server/supabase/shared-message-with-teacher';

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

  const { message_ids } = await req.json();

  if (!message_ids || message_ids.length === 0) {
    return new Response('No message IDs provided', { status: 400 });
  }

  try {
    await removeSharedMessagesWithTeacher(userProfile.id, message_ids);
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Messages removed successfully',
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
