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

  if (!accessToken || (messageContent === '' && !imageFile)) {
    return new Response('Missing sessionId or messageContent or imageFile', {
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
  const { data, error } = await supabase
    .from('profiles')
    .select('temporary_account_profiles(id)')
    .eq('id', userId)
    .single();
  if (!data || error) {
    console.error('Error fetching user profile:', error);
    return new Response('Error fetching user profile', { status: 500 });
  }
  if (
    !data?.temporary_account_profiles ||
    !data?.temporary_account_profiles.length
  ) {
    console.error('No temporary account found');
    return new Response('No temporary account found', { status: 400 });
  }
  const temporaryAccountId = data?.temporary_account_profiles[0].id;

  let imagePublicUrl = '';

  if (imageFile) {
    const imageFileBlob = decode(imageFile);
    const originalImagePath = `${userId}-${v4()}.png`;

    // 1. Upload the image file to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('student_message_submissions_image')
      .upload(originalImagePath, imageFileBlob, {
        contentType: 'image/png',
      });

    if (storageError) {
      console.error('Error uploading image to Supabase Storage:', storageError);
      return new Response('Error uploading image to Supabase Storage', {
        status: 500,
      });
    }

    // 2. Retrieve the public URL of the image file
    const { data } = await supabase.storage
      .from('student_message_submissions_image')
      .getPublicUrl(originalImagePath);
    imagePublicUrl = data.publicUrl || '';
  }

  const messageSubmissionResponse = await supabase
    .from('student_message_submissions')
    .insert([
      {
        message_content: messageContent,
        temporary_account_profile_id: temporaryAccountId,
        image_file_url: imagePublicUrl,
      },
    ]);

  if (messageSubmissionResponse.error) {
    console.error(
      'Error creating message submission:',
      messageSubmissionResponse.error,
    );
    return new Response('Error creating message submission', { status: 500 });
  }
  return new Response(JSON.stringify(messageSubmissionResponse.data), {
    status: 200,
  });
};

export default handler;
