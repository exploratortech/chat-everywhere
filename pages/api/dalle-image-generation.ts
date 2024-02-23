import { getAdminSupabaseClient } from '@/utils/server/supabase';
import { generateImage } from '@/utils/v2Chat/openAiApiUtils';

import { decode } from 'base64-arraybuffer';
import { v4 } from 'uuid';

const supabase = getAdminSupabaseClient();
export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};
const unauthorizedResponse = new Response('Unauthorized', { status: 401 });
const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  const { prompt, access_token } = (await req.json()) as {
    prompt: string;
    access_token: string;
  };
  if (!access_token || access_token) {
    return unauthorizedResponse;
  }

  const imageGenerationResponse = await generateImage(prompt);

  if (!imageGenerationResponse.data) {
    console.error('imageGenerationResponse: ', imageGenerationResponse);
    throw new Error(imageGenerationResponse.errorMessage);
  }

  const generatedImageInBase64 = imageGenerationResponse.data[0].b64_json;

  if (!generatedImageInBase64) {
    throw new Error('Failed to generate image');
  }

  console.log('Image generated successfully, storing to Supabase storage ...');

  // Store image in Supabase storage
  const imageFileName = `${v4()}.png`;
  const { error: fileUploadError } = await supabase.storage
    .from('ai-images')
    .upload(imageFileName, decode(generatedImageInBase64), {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/png',
    });
  if (fileUploadError) throw fileUploadError;

  const { data: imagePublicUrlData } = await supabase.storage
    .from('ai-images')
    .getPublicUrl(imageFileName);

  if (!imagePublicUrlData) throw new Error('Image generation failed');

  return new Response(
    JSON.stringify({
      imagePublicUrl: imagePublicUrlData.publicUrl,
      imageRevisedPrompt: imageGenerationResponse.data[0].revised_prompt,
    }),
  );
};

export default handler;

// The number of images to generate
