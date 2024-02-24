import {
  getAdminSupabaseClient,
  getOneTimeCodeInfo,
  getUserProfile,
} from '@/utils/server/supabase';

export const config = {
  runtime: 'edge',
};

const supabase = getAdminSupabaseClient();
const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const handler = async (req: Request): Promise<Response> => {
  const accessToken = req.headers.get('access-token');
  if (!accessToken) return unauthorizedResponse;

  const { data, error } = await supabase.auth.getUser(accessToken);
  const userId = data?.user?.id;
  if (!userId || error || !data?.user?.id) return unauthorizedResponse;

  if (error) {
    return new Response('Error', { status: 500 });
  }

  const userProfile = await getUserProfile(userId);

  if (!userProfile || !userProfile.isTeacherAccount)
    return unauthorizedResponse;

  console.log(userId);
  const tagsResponse = await supabase
    .from('teacher_tags')
    .select('*, tags!inner(*)')
    .eq('teacher_profile_id', userId);
  return new Response(
    JSON.stringify({
      tags: tagsResponse?.data?.map((teacherTag) => teacherTag.tags) || [],
    }),
    { status: 200 },
  );
};
export default handler;
