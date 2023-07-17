import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';

const supabase = getAdminSupabaseClient();

export const config = {
  runtime: 'edge',
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const handler = async (req: Request): Promise<Response> => {
  // const userToken = req.headers.get('user-token');

  // const { data, error } = await supabase.auth.getUser(userToken || '');
  // if (!data || error) return unauthorizedResponse;

  // const user = await getUserProfile(data.user.id);
  // if (!user || user.plan === 'free') return unauthorizedResponse;

  const { searchParams } = new URL(req.url);

  const buttonMessageId = searchParams.get('buttonMessageId');
  const imagePosition = searchParams.get('imagePosition');
  console.log({
    buttonMessageId,
    imagePosition,
  });

  const requestHeader = {
    Authorization: `Bearer ${process.env.THE_NEXT_LEG_API_KEY || ''}`,
    'Content-Type': 'application/json',
  };

  const apiResponse = await fetch(
    `https://api.thenextleg.io/upscale-img-url?buttonMessageId=${buttonMessageId}&button=U${imagePosition}`,
    {
      headers: requestHeader,
    },
  );

  console.log(apiResponse.ok);
  const responseJson = await apiResponse.json();

  return new Response(
    JSON.stringify({
      // imageUrl: imagePublicUrl,
      responseJson,
    }),
    { headers: { 'content-type': 'application/json' } },
  );
};

export default handler;
