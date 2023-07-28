import { getInstantMessageAppUser } from '@/utils/server/pairing';
import { getAdminSupabaseClient } from '@/utils/server/supabase';

const supabase = getAdminSupabaseClient();

export const config = {
  runtime: 'edge',
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'GET') {
    const res = new Response(null, {
      status: 405,
      statusText: 'Method Not Allowed',
    });
    return res;
  }

  const userToken = req.headers.get('user-token');

  const { data, error } = await supabase.auth.getUser(userToken || '');
  if (!data || error) return unauthorizedResponse;

  const pairCodeData = await getInstantMessageAppUser(data.user.id);
  const res = new Response(JSON.stringify(pairCodeData || {}));
  res.headers.set('Content-Type', 'application/json');

  return res;
};

export default handler;
