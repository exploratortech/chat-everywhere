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
    return new Response('Missing accessToken or messageContent or imageFile', {
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

  const { data: profileData, error: profileError } = await supabase.rpc(
    'get_temp_account_teacher_profile',
    { p_profile_id: userId },
  );

  if (!profileData || profileError) {
    console.error('Error fetching temp account teacher profile:', profileError);
    return new Response('Error fetching temp account teacher profile:', {
      status: 500,
    });
  }

  if (
    !profileData.length ||
    !profileData[0].temp_account_id ||
    !profileData[0].teacher_profile_id
  ) {
    console.error('No temp_account_id found or no teacher_profile_id found');
    return new Response(
      'No temp_account_id found or no teacher_profile_id found',
      { status: 400 },
    );
  }
  const temporaryAccountId = profileData[0].temp_account_id;
  const teacherProfileId = profileData[0].teacher_profile_id;
  const student_name = profileData[0].uniqueid;
  const tagIds = profileData[0].tag_ids;

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

  const messageAndTagsResponse = await supabase.rpc(
    'insert_student_message_with_tags',
    {
      _message_content: messageContent,
      _temporary_account_profile_id: temporaryAccountId,
      _image_file_url: imagePublicUrl,
      _teacher_profile_id: teacherProfileId,
      _student_name: student_name || '',
      _tag_ids: tagIds,
    },
  );

  if (messageAndTagsResponse.error) {
    console.error(
      'Error inserting message and tags via pg function:',
      messageAndTagsResponse.error,
    );
    return new Response('Error inserting message and tags', { status: 500 });
  }

  return new Response(JSON.stringify(messageAndTagsResponse.data), {
    status: 200,
  });
};

export default handler;
