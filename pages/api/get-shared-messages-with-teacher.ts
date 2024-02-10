import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { getAdminSupabaseClient } from '@/utils/server/supabase';

import { decode } from 'base64-arraybuffer';
import { v4 } from 'uuid';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const handler = async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { accessToken, messageContent, imageFile } = (await req.json()) as {
    accessToken: string;
    messageContent: string;
    imageFile: string | null;
  };

  const supabase = getAdminSupabaseClient();

  if (!accessToken) {
    return new Response('Missing accessToken', {
      status: 400,
    });
  }

  const userRes = await supabase.auth.getUser(accessToken);

  if (!userRes || userRes.error) {
    console.error('No user found with this access token');
    return new Response('No user found with this access token', {
      status: 400,
    });
  }

  const userId = userRes.data.user.id;

  const teacherProfileId = userId;

  const page = parseInt(req.url?.split('?page=')[1] || '1', 10);
  const pageSize = 10;
  const {
    data: messagesData,
    error: messagesError,
    count,
  } = await supabase
    .from('student_message_submissions')
    .select(
      `
      id,
      message_content,
      image_file_url,
      created_at,
      temporary_account_profiles (
        uniqueId
      )
    `,
      { count: 'exact' },
    )
    .eq('teacher_profile_id', teacherProfileId)
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  console.log({
    messagesData,
    messagesError,
    count,
  });

  if (messagesError) {
    console.error('Error fetching messages:', messagesError);
    return new Response('Error fetching messages', {
      status: 500,
    });
  }

  return new Response(
    JSON.stringify({
      submissions: messagesData,
    }),
    {
      status: 200,
    },
  );
};

export default handler;
