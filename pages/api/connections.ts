import { NextRequest } from 'next/server';

import {
  getAdminSupabaseClient,
  getInstantMessageAppUser,
} from '@/utils/server/supabase';
import { unpair } from '@/utils/server/pairing';
import { PairPlatforms } from '@/types/pair';

const supabase = getAdminSupabaseClient();

export const config = {
  runtime: 'edge',
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const handler = async (req: NextRequest): Promise<Response> => {
  const userToken = req.headers.get('user-token');

  const { data, error } = await supabase.auth.getUser(userToken || '');
  if (!data || error) return unauthorizedResponse;

  const { searchParams } = req.nextUrl;

  switch (req.method) {
    case 'GET':
      try {
        const pairCodeData = await getInstantMessageAppUser({ userId: data.user.id });
        return new Response(JSON.stringify(pairCodeData), {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        });
      } catch (error) {
        console.error(error);
        return new Response('Unable to retrieve connection data.', { status: 500 });
      }
    case 'DELETE':
      try {
        const app = searchParams.get('app');

        if (app == null)
          return new Response('Missing \'app\' parameter', { status: 400 });

        await unpair({ userId: data.user.id }, app as PairPlatforms);
        return new Response(null, { status: 200 });
      } catch (error) {
        console.error(error);
        return new Response('Unable to disconnect account.', { status: 500 });
      }
    default:
      return new Response('Method Not Allowed', { status: 405 });
  }
};

export default handler;
