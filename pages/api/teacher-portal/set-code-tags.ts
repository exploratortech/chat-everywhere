import {
  fetchUserProfileWithAccessToken,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { setTagsToOneTimeCode } from '@/utils/server/supabase/tags';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  const userProfile = await fetchUserProfileWithAccessToken(req);
  if (!userProfile || !userProfile.isTeacherAccount)
    return unauthorizedResponse;

  if (!req.body) {
    return new Response('No body provided', { status: 400 });
  }
  const requestBody = await req.json();
  const code_id: string = requestBody.code_id;
  const tag_ids: number[] = Array.isArray(requestBody.tag_ids)
    ? requestBody.tag_ids.map((id: any) => Number(id))
    : [];
  if (!code_id) {
    return new Response('No code_id provided', { status: 400 });
  }
  if (!tag_ids) {
    return new Response('No tag_ids provided', { status: 400 });
  }

  try {
    const selected_tag_ids = await setTagsToOneTimeCode(code_id, tag_ids);
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
