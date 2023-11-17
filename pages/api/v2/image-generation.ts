// This serverless function is responsible for generating an image for a message
// and storing it in the thread.
import { NextApiRequest, NextApiResponse } from 'next';

import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { getAdminSupabaseClient } from '@/utils/server/supabase';
import {
  generateImage,
  getOpenAiRunObject,
  submitToolOutput,
  updateMetadataOfMessage,
  waitForRunToCompletion,
} from '@/utils/v2Chat/openAiApiUtils';

import { decode } from 'base64-arraybuffer';
import { v4 } from 'uuid';

interface RequestBody {
  threadId: string;
  messageId: string;
  runId: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  console.log('Image generation endpoint is hit');

  const { threadId, messageId, runId } = req.body as RequestBody;

  if (!threadId || !messageId || !runId) {
    res.status(400).json({ error: 'Missing threadId or messageId or runId' });
    return;
  }

  console.log(
    'Generating image with threadId, messageId, runId ',
    threadId,
    messageId,
    runId,
  );

  const supabase = getAdminSupabaseClient();
  let toolCallId = null;
  const startTime = Date.now();

  try {
    const { data: thread } = await supabase
      .from('user_v2_conversations')
      .select('*')
      .eq('threadId', threadId)
      .single();

    if (!thread) {
      res.status(404).json({ error: 'Thread not found' });
      return;
    }

    const run = await getOpenAiRunObject(threadId, runId);

    const requiredAction = run.required_action;

    if (!requiredAction) {
      res.status(400).json({ error: 'Run does not require action' });
      return;
    }

    const toolCall = requiredAction.submit_tool_outputs.tool_calls.find(
      (toolCall) => toolCall.function.name === 'generate_image',
    );

    if (!toolCall) {
      res.status(400).json({ error: 'Tool call not found' });
      return;
    }

    toolCallId = toolCall.id;

    const imageGenerationPrompt = toolCall.function.arguments;
    const imageGenerationPromptString = JSON.parse(
      imageGenerationPrompt,
    ).prompt;

    console.log('imageGenerationPrompt: ', imageGenerationPrompt);

    const imageGenerationResponse = await generateImage(
      imageGenerationPromptString,
    );
    const generatedImageInBase64 = imageGenerationResponse.data[0].b64_json;

    if (!generatedImageInBase64) {
      if (imageGenerationResponse.errorMessage) {
        throw new Error(imageGenerationResponse.errorMessage);
      }
      throw new Error('Image generation failed');
    }
    console.log(
      'Image generated successfully, storing to Supabase storage ...',
    );

    // Store image in Supabase storage
    const imageFileName = `${messageId}-${v4()}.png`;
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

    console.log('Image access URL: ', imagePublicUrlData.publicUrl);

    await submitToolOutput(
      threadId,
      runId,
      toolCallId,
      "Successfully generated image, image is displayed on user's screen",
    );

    await waitForRunToCompletion(threadId, runId);

    await updateMetadataOfMessage(threadId, messageId, {
      imageGenerationStatus: 'completed',
      imageUrl: imagePublicUrlData.publicUrl,
    });

    serverSideTrackEvent('N/A', 'v2 Image generation processed', {
      v2ImageGenerationUrl: imagePublicUrlData.publicUrl,
      v2ImageGenerationDurationInMS: Date.now() - startTime,
    });

    res.status(200).end();
  } catch (error) {
    res.status(500).json({ error: 'Unable to generate image' });
    return;

    // Update meta data in message
    // await updateMetadataOfMessage(threadId, messageId, {
    //   imageGenerationStatus: 'failed',
    // });
    // if (toolCallId) {
    //   if (error instanceof Error) {
    //     console.log('error.message: ', error.message);

    //     serverSideTrackEvent('N/A', 'v2 Error', {
    //       errorMessage: error.message,
    //     });
    //     await submitToolOutput(
    //       threadId,
    //       runId,
    //       toolCallId,
    //       'Unable to generate image' +
    //         `${
    //           error.message
    //             ? `Error message: ${error.message}. Base on the error message, help user to decide what's the next best action to take.`
    //             : ''
    //         }`,
    //     );
    //   } else {
    //     await submitToolOutput(
    //       threadId,
    //       runId,
    //       toolCallId,
    //       'Unable to generate image' + `${error}`,
    //     );
    //   }
    //   await waitForRunToCompletion(threadId, runId);
    // }
    // serverSideTrackEvent('N/A', 'v2 Error', {
    //   errorMessage: 'Unable to generate image',
    // });
    // console.error(error);
    // res.status(500).json({ error: 'Unable to generate image' });
    // return;
  }
}
