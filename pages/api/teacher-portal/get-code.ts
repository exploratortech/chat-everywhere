import {  getTeacherOneTimeCode, getUserProfile } from '@/utils/server/supabase';

export const config = {
  runtime: 'edge',
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const handler = async (req: Request): Promise<Response> => {
  try {
    const userId = req.headers.get('user-id');
    if (!userId) return unauthorizedResponse;
    const userProfile = await getUserProfile(userId);

    if (!userProfile || userProfile.plan !== 'edu') return unauthorizedResponse;

    const { code, expiresAt } = await getTeacherOneTimeCode(userId);
    return new Response(JSON.stringify({ code, expiresAt }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
