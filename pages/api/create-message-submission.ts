import type { NextApiRequest, NextApiResponse } from 'next';

import { getAdminSupabaseClient } from '@/utils/server/supabase';

import { v4 } from 'uuid';
import { z } from 'zod';

const requestBodySchema = z.object({
  accessToken: z.string(),
  messageContent: z.string(),
  imageFileUrl: z.string().nullable(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let parsedBody;
  try {
    parsedBody = requestBodySchema.parse(req.body);
  } catch (e) {
    return res.status(400).json({ message: 'Invalid request body' });
  }

  const { accessToken, messageContent, imageFileUrl } = parsedBody;

  const supabase = getAdminSupabaseClient();

  const userRes = await supabase.auth.getUser(accessToken);

  if (!userRes || userRes.error) {
    console.error('No user found with this access token');
    return res
      .status(400)
      .json({ message: 'No user found with this access token' });
  }

  const userId = userRes.data.user.id;

  const { data: profileData, error: profileError } = await supabase.rpc(
    'get_temp_account_teacher_profile',
    { p_profile_id: userId },
  );

  if (!profileData || profileError) {
    console.error('Error fetching temp account teacher profile:', profileError);
    return res
      .status(500)
      .json({ message: 'Error fetching temp account teacher profile' });
  }

  if (
    !profileData.length ||
    !profileData[0].temp_account_id ||
    !profileData[0].teacher_profile_id
  ) {
    console.error('No temp_account_id found or no teacher_profile_id found');
    return res.status(400).json({
      message: 'No temp_account_id found or no teacher_profile_id found',
    });
  }
  const temporaryAccountId = profileData[0].temp_account_id;
  const teacherProfileId = profileData[0].teacher_profile_id;
  const student_name = profileData[0].uniqueid;
  const tagIds =
    profileData[0].tag_ids.filter((id: string) => id !== null) || [];

  let imagePublicUrl = '';

  if (imageFileUrl) {
    const response = await fetch(imageFileUrl);
    if (!response.ok) {
      console.error('Error downloading image:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries()),
      });
      return res.status(500).json({ message: 'Error downloading image' });
    }
    const imageFileBlob = await response.blob();
    const originalImagePath = `${userId}-${v4()}.png`;

    // 1. Upload the image file to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('student_message_submissions_image')
      .upload(originalImagePath, imageFileBlob, {
        contentType: 'image/png',
      });

    if (storageError) {
      console.error('Error uploading image to Supabase Storage:', storageError);
      return res
        .status(500)
        .json({ message: 'Error uploading image to Supabase Storage' });
    }

    // 2. Retrieve the public URL of the image file
    const { data } = supabase.storage
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
    return res
      .status(500)
      .json({ message: 'Error inserting message and tags' });
  }

  return res.status(200).json(messageAndTagsResponse.data);
}
