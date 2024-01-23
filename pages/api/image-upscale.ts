import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';

import { v4 } from 'uuid';

const supabase = getAdminSupabaseClient();

export const config = {
  runtime: 'edge',
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const handler = async (req: Request): Promise<Response> => {
  const userToken = req.headers.get('user-token');

  const { data, error } = await supabase.auth.getUser(userToken || '');
  if (!data || error) return unauthorizedResponse;

  const user = await getUserProfile(data.user.id);
  if (!user || user.plan === 'free') return unauthorizedResponse;

  const requestBody = await req.json();

  const { buttonMessageId, imagePosition, operation } = requestBody;

  const requestHeader = {
    Authorization: `Bearer ${process.env.MY_MIDJOURNEY_API_KEY || ''}`,
    'Content-Type': 'application/json',
  };

  const imageGenerationResponse = await fetch(
    `https://api.thenextleg.io/upscale?buttonMessageId=${buttonMessageId}&button=U${imagePosition}`,
    {
      headers: requestHeader,
    },
  );

  if (!imageGenerationResponse) {
    throw new Error('Image generation failed');
  }

  const resultEncodedImage = await imageGenerationResponse.arrayBuffer();

  // Image received, upload to Supabase storage
  const imageFileName = `${user.id}-${v4()}.png`;
  const { error: fileUploadError } = await supabase.storage
    .from('ai-images')
    .upload(imageFileName, resultEncodedImage, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/png',
    });
  if (fileUploadError) throw fileUploadError;

  const { data: imagePublicUrlData } = await supabase.storage
    .from('ai-images')
    .getPublicUrl(imageFileName);

  if (!imagePublicUrlData) throw new Error('Image generation failed');

  const imagePublicUrl = imagePublicUrlData.publicUrl;

  return new Response(
    JSON.stringify({
      imageUrl: imagePublicUrl,
    }),
  );
};

export default handler;
