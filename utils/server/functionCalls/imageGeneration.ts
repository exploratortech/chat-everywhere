import { getAdminSupabaseClient } from '@/utils/server/supabase';
import {
  generateImage,
  updateMetadataOfMessage,
} from '@/utils/v2Chat/openAiApiUtils';

import { decode } from 'base64-arraybuffer';
import { v4 } from 'uuid';

export const generateDallEImage = async ({
  prompt,
  messageId,
  threadId,
}: {
  prompt: string;
  messageId: string;
  threadId: string;
}): Promise<string> => {
  console.log('imageGenerationPrompt: ', prompt);

  await updateMetadataOfMessage(threadId, messageId, {
    imageGenerationStatus: 'in progress',
  });

  const imageGenerationResponse = await generateImage(prompt);
  const generatedImageInBase64 = imageGenerationResponse.data[0].b64_json;
  if (!generatedImageInBase64) {
    if (imageGenerationResponse.errorMessage) {
      throw new Error(imageGenerationResponse.errorMessage);
    }
    throw new Error('Image generation failed');
  }
  console.log('Image generated successfully, storing to Supabase storage ...');

  // Store image in Supabase storage
  const supabase = getAdminSupabaseClient();
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

  await updateMetadataOfMessage(threadId, messageId, {
    imageGenerationStatus: 'completed',
    imageUrl: imagePublicUrlData.publicUrl,
  });

  return imagePublicUrlData.publicUrl;
};
