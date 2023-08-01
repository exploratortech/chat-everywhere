import { trackError } from '@/utils/app/azureTelemetry';

import {
  getAdminSupabaseClient,
  getUserProfile,
  uploadAttachments,
} from '@/utils/server/supabase';

const supabase = getAdminSupabaseClient();

export const config = {
  runtime: 'edge',
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

export default async function handler(req: Request): Promise<Response> {
  const userToken = req.headers.get('user-token');

  const { data, error } = await supabase.auth.getUser(userToken || '');
  if (!data || error) return unauthorizedResponse;

  const user = await getUserProfile(data.user.id);
  if (!user) return unauthorizedResponse;

  switch (req.method) {
    case 'POST': {
      const formData = await req.formData();
      const entries = formData.getAll('attachments[]');

      const files: File[] = [];
      for (const entry of entries) {
        if (entry instanceof File) files.push(entry);
      }

      try {
        const errors = await uploadAttachments(user.id, files);
        return new Response(JSON.stringify({ errors }), { status: 200 });
      } catch (error) {
        console.error(error);
        return new Response('Unable to upload file(s)', { status: 500 });
      }
    }
    default:
      return new Response('Method Not Allowed', { status: 405 });
  }
};
