import { NextResponse } from 'next/server';

import { makeWriteToStream } from '@/utils/app/streamHandler';
import {
  addUsageEntry,
  getAdminSupabaseClient,
  getUserProfile,
  hasUserRunOutOfCredits,
  subtractCredit,
} from '@/utils/server/supabase';
import { generateImage } from '@/utils/v2Chat/openAiApiUtils';

import { ChatBody } from '@/types/chat';
import { PluginID } from '@/types/plugin';

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

  const userToken = req.headers.get('user-token');
  const requestBody = (await req.json()) as ChatBody;

  if (!userToken) {
    return unauthorizedResponse;
  }
  const prompt = requestBody.messages[requestBody.messages.length - 1].content;
  if (!prompt) {
    return new Response('Prompt is required', { status: 400 });
  }

  const { data, error } = await supabase.auth.getUser(userToken || '');
  if (!data || error) return unauthorizedResponse;

  const user = await getUserProfile(data.user.id);
  if (!user || user.plan === 'free') return unauthorizedResponse;

  const isUserInUltraPlan = user.plan === 'ultra';

  if (
    !isUserInUltraPlan &&
    (await hasUserRunOutOfCredits(data.user.id, PluginID.IMAGE_GEN)) // USING IMAGE_GEN for credit system
  ) {
    return new Response('Error', {
      status: 402,
      statusText: 'Ran out of Image generation credit',
    });
  }

  // Image gen start here
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const writeToStream = makeWriteToStream(writer, encoder);

  const imageGeneration = async () => {
    await writeToStream('Start generating image ... \n');

    try {
      const imageGenerationResponse = await generateImage(prompt);
      if (!imageGenerationResponse.data) {
        console.error('imageGenerationResponse: ', imageGenerationResponse);
        throw new Error(imageGenerationResponse.errorMessage);
      }

      const generatedImageInBase64 = imageGenerationResponse.data[0].b64_json;

      if (!generatedImageInBase64) {
        throw new Error('Failed to generate image');
      }

      console.log(
        'Image generated successfully, storing to Supabase storage ...',
      );

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

      // USING IMAGE_GEN for credit system
      if (!isUserInUltraPlan) {
        await addUsageEntry(PluginID.IMAGE_GEN, user.id);
        await subtractCredit(user.id, PluginID.IMAGE_GEN);
      }

      await writeToStream(
        `# Generated Image\n![Generated Image](${imagePublicUrlData.publicUrl})\n\n# Revised Prompt\n${imageGenerationResponse.data[0].revised_prompt}`,
        false,
        true,
      );

      await writeToStream('[DONE]');
      writer.close();
      return;
    } catch (error) {
      console.log(error);

      await writeToStream(
        'Error occurred while generating image, please try again later.',
      );

      await writeToStream('[DONE]');
      writer.close();
      return;
    }
  };

  imageGeneration();
  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
  //   return new Response(
  //     JSON.stringify({
  //       imagePublicUrl: imagePublicUrlData.publicUrl,
  //       imageRevisedPrompt: imageGenerationResponse.data[0].revised_prompt,
  //     }),
  //   );
};

export default handler;

// The number of images to generate
