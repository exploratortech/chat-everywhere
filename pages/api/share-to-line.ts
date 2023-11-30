import { trackEvent } from '@/utils/app/eventTracking';
import { getAdminSupabaseClient } from '@/utils/server/supabase';

import { decode } from 'base64-arraybuffer';
import { v4 } from 'uuid';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { accessToken, messageContent, imageFile } = (await req.json()) as {
    accessToken: string;
    messageContent: string;
    imageFile: string | null;
  };

  if (!accessToken || (messageContent === '' && !imageFile)) {
    return new Response('Missing sessionId or messageContent or imageFile', {
      status: 400,
    });
  }

  const supabase = getAdminSupabaseClient();
  const user = await supabase.auth.getUser(accessToken);

  if (!user) {
    console.error('No user found with this access token');
    return new Response('No user found with this access token', {
      status: 400,
    });
  }

  // Retrieve access token from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('line_access_token')
    .match({ id: user.data.user?.id })
    .single();

  if (!profile || profileError) {
    console.error('Error fetching user profile:', profileError);
    return new Response('Error fetching user profile', { status: 500 });
  }

  const lineAccessToken = profile.line_access_token as string;
  let lineNotifyPayload: string | null = null;

  if (imageFile) {
    const imageFileBlob = decode(imageFile);
    const originalImagePath = `${user.data.user?.id}-${v4()}.png`;

    // 1. Upload the image file to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('LINE-share-images')
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
    const { data: imagePublicUrl } = await supabase.storage
      .from('LINE-share-images')
      .getPublicUrl(originalImagePath);

    // 3. Retrieve the public URL of the transformed image file
    const thumbnailImageUrl = await supabase.storage
      .from('LINE-share-images')
      .getPublicUrl(originalImagePath, {
        transform: {
          width: 240,
          height: 240,
          resize: 'cover',
        },
      });

    lineNotifyPayload = `imageThumbnail=${encodeURIComponent(
      thumbnailImageUrl.data.publicUrl,
    )}&imageFullsize=${encodeURIComponent(
      imagePublicUrl.publicUrl,
    )}&message=${encodeURIComponent('Your Beautiful image!')}`;

    console.log(thumbnailImageUrl.data.publicUrl, imagePublicUrl.publicUrl);
  }

  // Send message to LINE
  const response = await fetch('https://notify-api.line.me/api/notify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${lineAccessToken}`,
    },
    body: lineNotifyPayload || `message=${encodeURIComponent(messageContent)}`,
  });

  if (!response.ok) {
    if (response.status === 401) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ line_access_token: null })
        .match({ id: user.data.user?.id });

      if (updateError) {
        console.error('Error updating user profile:', updateError);
      }
      return new Response('Invalid access token', { status: 401 });
    }
    console.error(await response.text());
    return new Response('Failed to send message to LINE', { status: 500 });
  }

  trackEvent('Share to Line');
  return new Response('', { status: 200 });
};

export default handler;
