import { getPairCodeData } from '@/utils/server/pairing';
import { getAdminSupabaseClient } from '@/utils/server/supabase';

const supabase = getAdminSupabaseClient();

export const config = {
  runtime: 'edge',
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const handler = async (req: Request): Promise<Response> => {
  const userToken = req.headers.get('user-token');

  const { data, error } = await supabase.auth.getUser(userToken || '');
  if (!data || error) return unauthorizedResponse;

  const pairCodeData = await getPairCodeData(data.user.id);
  const res = new Response(
    pairCodeData ? JSON.stringify(pairCodeData) : null
  );
  res.headers.set('Content-Type', 'application/json');

  return res;
};

export default handler;
