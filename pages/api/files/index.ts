import { NextRequest } from 'next/server';
import Papa from 'papaparse';

import { trackError } from '@/utils/app/azureTelemetry';
import {
  deleteFiles,
  downloadFiles,
  fetchFiles,
  fetchNumberOfFiles,
  getAdminSupabaseClient,
  getUserProfile,
  uploadFiles,
} from '@/utils/server/supabase';
import { MAX_NUM_FILES } from '@/utils/app/const';

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

    const { searchParams } = req.nextUrl;
  
    switch (req.method) {
      case 'GET': {
        try {
          const download = searchParams.get('download');
          const next = searchParams.get('next');
          const query = searchParams.get('query');

          if (download) {
            const filenames = Papa.parse<string[]>(download).data[0];
            const { blob, error } = await downloadFiles(user.id, filenames);
            if (error) return new Response(error, { status: 404 });
            return new Response(blob, { status: 200 });
          } else {
            const results = await Promise.all([
              fetchFiles(user.id, next, query),
              fetchNumberOfFiles(user.id),
            ]);

            return new Response(
              JSON.stringify({ ...results[0], total: results[1],  }),
              { status: 200 },
            );
          }
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
          const fileCount = await fetchNumberOfFiles(user.id);

          if (fileCount == null) {
            return new Response('Failed to get file count', { status: 400 });
          }

          if (fileCount + files.length > MAX_NUM_FILES) {
            return new Response(
              `Maximum number of files reached (${MAX_NUM_FILES})`,
              { status: 400 },
            );
          }

          const data = await uploadFiles(user.id, files, fileData, sync);
          return new Response(JSON.stringify(data), { status: 200 });
        } catch (error) {
          console.error(error);
          trackError(error as string);
          return new Response('Unable to upload file(s)', { status: 400 });
        }
      };
      case 'DELETE': {
        const csvFilenames = searchParams.get('names');
        if (!csvFilenames) {
          return new Response('Missing \'names\' parameter', { status: 400 });
        }
  
        try {
          let data!: { count: number };
          if (csvFilenames === '*') {
            data = await deleteFiles(user.id, [], true);
          } else {
            const filenames = Papa.parse<string[]>(csvFilenames).data[0];
            data = await deleteFiles(user.id, filenames);
          }
          return new Response(JSON.stringify(data), { status: 200 });
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
