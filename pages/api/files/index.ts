import { NextRequest } from 'next/server';
import Papa from 'papaparse';

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
      case 'DELETE': {
        const { searchParams } = req.nextUrl;
  
        const csvFilenames = searchParams.get('names');
        if (!csvFilenames) {
          return new Response('Missing \'names\' parameter', { status: 400 });
        }
  
        try {
          if (csvFilenames === '*') {
            await deleteFiles(user.id, [], true);
          } else {
            const filenames = Papa.parse<string[]>(csvFilenames).data[0];
            await deleteFiles(user.id, filenames);
          }
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
