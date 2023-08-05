import { trackError } from '@/utils/app/azureTelemetry';

import {
  deleteFiles,
  fetchFiles,
  getAdminSupabaseClient,
  getUserProfile,
  uploadFiles,
} from '@/utils/server/supabase';

const supabase = getAdminSupabaseClient();

export const config = {
  runtime: 'edge',
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

export default async function handler(req: Request): Promise<Response> {
  try {
    const userToken = req.headers.get('user-token');
  
    const { data, error } = await supabase.auth.getUser(userToken || '');
    if (!data || error) return unauthorizedResponse;
  
    const user = await getUserProfile(data.user.id);
    if (!user) return unauthorizedResponse;
  
    switch (req.method) {
      case 'GET': {
        try {
          const url = new URL(req.url);
          const searchParams = new URLSearchParams(url.search);
          const next: string | null = searchParams.get('next');
          const data = await fetchFiles(user.id, next || null);
          return new Response(JSON.stringify(data), { status: 200 });
        } catch (error) {
          console.error(error);
          return new Response('Unable to retrieve files', { status: 400 });
        }
      };
      case 'POST': {
        const formData = await req.formData();
        const entries = formData.getAll('files[]');
  
        const files: File[] = [];
        for (const entry of entries) {
          if (entry instanceof File) files.push(entry);
        }
  
        try {
          const errors = await uploadFiles(user.id, files);
          return new Response(JSON.stringify({ errors }), { status: 200 });
        } catch (error) {
          console.error(error);
          return new Response('Unable to upload file(s)', { status: 400 });
        }
      };
      case 'DELETE': {
        const url = new URL(req.url);
        const searchParams = new URLSearchParams(url.search);
  
        const csv = searchParams.get('names');
        if (!csv) {
          return new Response('Missing \'names\' parameter', { status: 400 });
        }
  
        try {
          const filenames: string[] = csv.split(',');
          const deletedFilenames = await deleteFiles(user.id, filenames);
          return new Response(JSON.stringify({ filenames: deletedFilenames }), { status: 200 });
        } catch (error) {
          console.error(error);
          return new Response('Unable to delete file(s)', { status: 400 });
        }
      };
      default:
        return new Response('Method Not Allowed', { status: 405 });
    }
  } catch (error) {
    console.error(error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
