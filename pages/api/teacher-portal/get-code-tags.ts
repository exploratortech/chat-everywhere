import {
  fetchUserProfileWithAccessToken,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { getOneTimeCodeTags } from '@/utils/server/supabase/tags';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  const userProfile = await fetchUserProfileWithAccessToken(req);
  if (!userProfile || !userProfile.isTeacherAccount)
    return unauthorizedResponse;

  const code_id: string | null = req.headers.get('code_id');
  if (!code_id) {
    return new Response('No code_id provided', { status: 400 });
  }

  try {
    const selected_tag_ids = await getOneTimeCodeTags(code_id);
    return new Response(
      JSON.stringify({
        selected_tag_ids,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return new Response('Error getting tags', { status: 500 });
  }
};
export default handler;
