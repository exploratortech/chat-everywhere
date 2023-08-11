import { trackError } from '@/utils/app/azureTelemetry';

import {
  downloadFile,
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';
import { NextRequest } from 'next/server';

const supabase = getAdminSupabaseClient();

export const config = {
  runtime: 'edge',
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

export default async function handler(req: NextRequest): Promise<Response> {
  try {
    const userToken = req.headers.get('user-token');
  
    const { data, error } = await supabase.auth.getUser(userToken || '');
    if (!data || error) return unauthorizedResponse;
  
    const user = await getUserProfile(data.user.id);
    if (!user) return unauthorizedResponse;
  
    switch (req.method) {
      case 'GET': {
        try {
          const { pathname, searchParams } = req.nextUrl;

          const fileId = pathname.split('/').at(-1)!;
          const by: 'name' | 'id' = searchParams.get('by') as any;

          if (!by) {
            return new Response('Missing \'by\' parameter', { status: 400 });
          }

          let blob!: Blob | null;
          if (by === 'name') {
            blob = await downloadFile(user.id, { filename: fileId });
          } else {
            blob = await downloadFile(user.id, { fileId });
          }

          if (blob == null) {
            return new Response('Could not find file', { status: 404 });
          }

          return new Response(blob, { status: 200 });
        } catch (error) {
          console.error(error);
          trackError(error as string);
          return new Response('Unable to retrieve files', { status: 400 });
        }
      };
      default:
        return new Response('Method Not Allowed', { status: 405 });
    }
  } catch (error) {
    console.error(error);
    trackError(error as string);
    return new Response('Internal Server Error', { status: 500 });
  }
};
