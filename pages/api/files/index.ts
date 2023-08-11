import { trackError } from '@/utils/app/azureTelemetry';
import { validateFilename } from '@/utils/app/uploadedFiles';

import {
  deleteFiles,
  fetchFiles,
  getAdminSupabaseClient,
  getUserProfile,
  renameFile,
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
          trackError(error as string);
          return new Response('Unable to retrieve files', { status: 400 });
        }
      };
      case 'POST': {
        const formData = await req.formData();

        const filesEntry = formData.getAll('files[]');
        const sync: boolean = formData.get('sync') === 'true';
        let fileData!: any;

        try {
          const jsonString = formData.get('file_data');
          if (!jsonString) {
            fileData = { updatedAt: {} };
          } else {
            fileData = JSON.parse(jsonString as string);
          }
        } catch (error) {
          return new Response('Malformed parameter `file_data`', { status: 400 });
        }
  
        const files: File[] = [];
        for (const entry of filesEntry) {
          if (entry instanceof File) files.push(entry);
        }

        if (!files.length) {
          return new Response('No files uploaded', { status: 400 });
        }
  
        try {
          const errors = await uploadFiles(user.id, files, fileData, sync);
          return new Response(JSON.stringify({ errors }), { status: 200 });
        } catch (error) {
          console.error(error);
          trackError(error as string);
          return new Response('Unable to upload file(s)', { status: 400 });
        }
      };
      case 'PATCH': {
        try {
          const { old_name: oldName, new_name: newName } = await req.json();

          if (!validateFilename(newName)) {
            return new Response(
              'Filename cannot contain the following characters: \\/:"*?<>|',
              { status: 400 },
            );
          }

          if (!oldName || !newName) {
            return new Response(
              'Missing \'old_name\' or \'new_name\' parameters',
              { status: 400 },
            );
          }

          await renameFile(user.id, oldName, newName);
          return new Response(null, { status: 200 });
        } catch (error) {
          console.error(error);
          trackError(error as string);
          if (error instanceof Error) {
            return new Response(error.message, { status: 400 });
          } else {
            return new Response('Unable to update file', { status: 400 });
          }
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
