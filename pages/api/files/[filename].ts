import { NextRequest } from 'next/server';

import { trackError } from '@/utils/app/azureTelemetry';
import {
  deleteFiles,
  downloadFiles,
  getAdminSupabaseClient,
  getUserProfile,
  renameFile,
} from '@/utils/server/supabase';

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

    const filename = decodeURIComponent(
      req.nextUrl.pathname.split('/').at(-1)!
    );
  
    switch (req.method) {
      case 'GET': {
        try {
          let { blob, error }  = await downloadFiles(user.id, [filename]);
          if (error) {
            return new Response(error, { status: 404 });
          }
          return new Response(blob, { status: 200 });
        } catch (error) {
          console.error(error);
          trackError(error as string);
          return new Response('Unable to retrieve files', { status: 400 });
        }
      };
      case 'PATCH': {
        try {
          const { new_name: newName } = await req.json();

          if (!newName) {
            return new Response(
              'Missing \'new_name\' parameter',
              { status: 400 },
            );
          }
          
          await renameFile(user.id, filename, newName);
          return new Response(null, { status: 200 });
        } catch (error) {
          console.error(error);
          trackError(error as string);
          return new Response('Unable to update file', { status: 400 });
        }
      };
      case 'DELETE': {
        try {
          await deleteFiles(user.id, [filename]);
          return new Response(null, { status: 200 });
        } catch (error) {
          console.error(error);
          trackError(error as string);
          return new Response('Unable to delete file(s)', { status: 400 });
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
