import {
  fetchUserProfileWithAccessToken,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { addTagToTeacherProfile } from '@/utils/server/supabase/tags';

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
  const { tag_name }: { tag_name: string } = requestBody;
  if (!tag_name) {
    return new Response('Tag name is required', { status: 400 });
  }

  const isAdded = await addTagToTeacherProfile(userProfile.id, tag_name);
  if (!isAdded) {
    return new Response('Failed to add tag', { status: 500 });
  }

  return new Response(
    JSON.stringify({
      isAdded,
    }),
    { status: 200 },
  );
};
export default handler;
