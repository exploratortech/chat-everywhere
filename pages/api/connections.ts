import { NextRequest } from 'next/server';

import {
  getAdminSupabaseClient,
  getInstantMessageAppUser,
} from '@/utils/server/supabase';

const supabase = getAdminSupabaseClient();

export const config = {
  runtime: 'edge',
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const handler = async (req: NextRequest): Promise<Response> => {
  const userToken = req.headers.get('user-token');

  const { data, error } = await supabase.auth.getUser(userToken || '');
  if (!data || error) return unauthorizedResponse;

  switch (req.method) {
    case 'GET':
      const pairCodeData = await getInstantMessageAppUser({ userId: data.user.id });
      return new Response(JSON.stringify(pairCodeData), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    default:
      return new Response('Method Not Allowed', { status: 405 });
  }
};

export default handler;
