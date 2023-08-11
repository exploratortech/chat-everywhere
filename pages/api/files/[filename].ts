import { trackError } from '@/utils/app/azureTelemetry';
import { validateFilename } from '@/utils/app/uploadedFiles';

import {
  downloadFile,
  getAdminSupabaseClient,
  getUserProfile,
  renameFile,
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

    const filename = req.nextUrl.pathname.split('/').at(-1)!;
  
    switch (req.method) {
      case 'GET': {
        try {
          let blob  = await downloadFile(user.id, filename);
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
      default:
        return new Response('Method Not Allowed', { status: 405 });
    }
  } catch (error) {
    console.error(error);
    trackError(error as string);
    return new Response('Internal Server Error', { status: 500 });
  }
};
