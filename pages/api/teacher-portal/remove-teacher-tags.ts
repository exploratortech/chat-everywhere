import {
  fetchUserProfileWithAccessToken,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { removeTagsFromTeacherProfile } from '@/utils/server/supabase/tags';

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

  if (!req.body) {
    return new Response('No body provided', { status: 400 });
  }
  const requestBody = await req.json();
  const tag_ids: number[] = Array.isArray(requestBody.tag_ids)
    ? requestBody.tag_ids
    : [];

  return new Response(
    JSON.stringify({
      isRemoved: await removeTagsFromTeacherProfile(userProfile.id, tag_ids),
    }),
    { status: 200 },
  );
};
export default handler;
