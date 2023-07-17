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

  const requestHeader = {
    Authorization: `Bearer ${process.env.THE_NEXT_LEG_API_KEY || ''}`,
    'Content-Type': 'application/json',
  };

  const imageUrl =
    'https://cdn.midjourney.com/26176adb-4f4a-425f-877f-9c477f291461/0_1.png';
  const upscaleUrl = `https://cdn.midjourney.com/26176adb-4f4a-425f-877f-9c477f291461/0_3.png`;
  const zoomPrompt = '--zoom 2';
  const newMsg = `${upscaleUrl} Tiger monster with monstera plant over him, back alley in Bangkok, art by Otomo Katsuhiro crossover Yayoi Kusama and Hayao Miyazaki ${zoomPrompt}`;

  const apiResponse = await fetch(`https://api.thenextleg.io/v2/imagine`, {
    headers: requestHeader,
    method: 'POST',
    body: JSON.stringify({
      msg: newMsg,
    }),
  });
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
