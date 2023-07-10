import { NextResponse } from 'next/server';

import {
  DEFAULT_IMAGE_GENERATION_QUALITY,
  DEFAULT_IMAGE_GENERATION_STYLE,
} from '@/utils/app/const';
import { capitalizeFirstLetter } from '@/utils/app/ui';
import { translateAndEnhancePrompt } from '@/utils/server/imageGen';
import {
  addUsageEntry,
  getAdminSupabaseClient,
  getUserProfile,
  hasUserRunOutOfCredits,
  subtractCredit,
} from '@/utils/server/supabase';

import { ChatBody } from '@/types/chat';
import { PluginID } from '@/types/plugin';

const supabase = getAdminSupabaseClient();

export const config = {
  runtime: 'edge',
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const MAX_TIMEOUT = 600; // 10 minutes

const generateMjPrompt = (
  userInputText: string,
  style: string = DEFAULT_IMAGE_GENERATION_STYLE,
  quality: string = DEFAULT_IMAGE_GENERATION_QUALITY,
  temperature: number = 0.5,
): string => {
  let resultPrompt = userInputText;

  if (style !== 'Default') {
    resultPrompt += `, ${capitalizeFirstLetter(style)}`;
  }

  switch (quality) {
    case 'High':
      resultPrompt += ' --quality 1';
      break;
    case 'Medium':
      resultPrompt += ' --quality .5';
      break;
    case 'Low':
      resultPrompt += ' --quality .25';
      break;
    default:
      resultPrompt += ' --quality 1';
      break;
  }

  if (temperature === 0.5) {
    resultPrompt += ' --chaos 5';
  } else if (temperature > 0.5) {
    resultPrompt += ' --chaos 50';
  }

  return resultPrompt + ' --v 5.1';
};

const handler = async (req: Request): Promise<Response> => {
  const userToken = req.headers.get('user-token');

  const { data, error } = await supabase.auth.getUser(userToken || '');
  if (!data || error) return unauthorizedResponse;

  const user = await getUserProfile(data.user.id);
  if (!user || user.plan === 'free') return unauthorizedResponse;

  if (await hasUserRunOutOfCredits(data.user.id, PluginID.IMAGE_GEN)) {
    return new Response('Error', {
      status: 402,
      statusText: 'Ran out of Image generation credit',
    });
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  let generationPrompt = '';

  let jobTerminated = false;

  const writeToStream = async (text: string, removeLastLine?: boolean) => {
    if (removeLastLine) {
      await writer.write(encoder.encode('[REMOVE_LAST_LINE]'));
    }
    await writer.write(encoder.encode(text));
  };

  const requestBody = (await req.json()) as ChatBody;

  // Do not modity this line, it is used by front-end to detect if the message is for image generation
  writeToStream('```MJImage \n');
  writeToStream('Initializing ... \n');
  writeToStream(
    'This feature is still in Beta, please expect some non-ideal images and report any issue to admin. Thanks. \n',
  );

  const latestUserPromptMessage =
    requestBody.messages[requestBody.messages.length - 1].content;

  const imageGeneration = async () => {
    const requestHeader = {
      Authorization: `Bearer ${process.env.THE_NEXT_LEG_API_KEY || ''}`,
      'Content-Type': 'application/json',
    };

    try {
      // Translate and enhance the prompt
      writeToStream(`Enhancing and translating user input prompt ... \n`);
      generationPrompt = await translateAndEnhancePrompt(
        latestUserPromptMessage,
      );

      generationPrompt = generateMjPrompt(
        generationPrompt,
        requestBody.imageStyle,
        requestBody.imageQuality,
        requestBody.temperature,
      );

      writeToStream(`Prompt: ${generationPrompt} \n`, true);
      const imageGenerationResponse = await fetch(
        `https://api.thenextleg.io/v2/imagine`,
        {
          method: 'POST',
          headers: requestHeader,
          body: JSON.stringify({
            msg: generationPrompt,
          }),
        },
      );

      if (!imageGenerationResponse.ok) {
        throw new Error('Image generation failed');
      }

      const imageGenerationResponseJson = await imageGenerationResponse.json();

      if (
        imageGenerationResponseJson.success !== true ||
        !imageGenerationResponseJson.messageId
      ) {
        console.log(imageGenerationResponseJson);
        console.error('Failed during submitting request');
        throw new Error('Image generation failed');
      }

      const imageGenerationMessageId = imageGenerationResponseJson.messageId;

      // Check every 3.5 seconds if the image generation is done
      let generationStartedAt = Date.now();
      let imageGenerationProgress = null;

      const getTotalGenerationTime = () =>
        Math.round((Date.now() - generationStartedAt) / 1000);

      while (
        !jobTerminated &&
        (Date.now() - generationStartedAt < MAX_TIMEOUT * 1000 ||
          imageGenerationProgress < 100)
      ) {
        await sleep(3500);
        const imageGenerationProgressResponse = await fetch(
          `https://api.thenextleg.io/v2/message/${imageGenerationMessageId}?authToken=${process.env.THE_NEXT_LEG_API_KEY}`,
          { method: 'GET' },
        );

        if (!imageGenerationProgressResponse.ok) {
          console.log(await imageGenerationProgressResponse.status);
          console.log(await imageGenerationProgressResponse.text());
          throw new Error('Unable to fetch image generation progress');
        }

        const imageGenerationProgressResponseJson =
          await imageGenerationProgressResponse.json();

        const generationProgress = imageGenerationProgressResponseJson.progress;

        if (generationProgress === 100) {
          writeToStream(`Completed in ${getTotalGenerationTime()}s \n`);
          writeToStream('``` \n');

          const imageUrl =
            imageGenerationProgressResponseJson.response.imageUrl;
          const imageAlt = latestUserPromptMessage
            .replace(/\s+/g, '-')
            .slice(0, 20);

          if (!imageUrl) {
            // run when image url is available
            const mjResponseContent =
              imageGenerationProgressResponseJson.response.content;
            const isInvalidUserAction =
              mjResponseContent &&
              invalidUserActionList.includes(mjResponseContent);
            if (isInvalidUserAction) {
              writeToStream(`Error: ${mjResponseContent} \n`);
              writer.close();
              return;
            }
            throw new Error(
              `Internal error during image generation process {${
                mjResponseContent || 'No response content'
              }}`,
            );
          } else {
            // run when image url is available
            writeToStream(
              `![${imageAlt}](${imageGenerationProgressResponseJson.response.imageUrl} "${imageGenerationProgressResponseJson.response.buttonMessageId}") \n`,
            );
            await addUsageEntry(PluginID.IMAGE_GEN, user.id);
            await subtractCredit(user.id, PluginID.IMAGE_GEN);

            imageGenerationProgress = 100;

            await writeToStream('[DONE]');
            writer.close();
            return;
          }
        } else {
          if (imageGenerationProgress === null) {
            writeToStream(`Start to generate \n`);
          } else {
            writeToStream(
              `${
                generationProgress === 0
                  ? 'Waiting to be processed'
                  : `${generationProgress}% complete`
              } ... ${getTotalGenerationTime()}s \n`,
              true,
            );
          }
          imageGenerationProgress = generationProgress;
        }
      }

      await writeToStream('[DONE]');
      await writeToStream(
        'Unable to finish the generation in 5 minutes, please try again later.',
      );
      writer.close();
      return;
    } catch (error) {
      jobTerminated = true;

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
};

export default handler;

const codeList = [
  'ALREADY_REQUESTED_UPSCALE',
  'BOT_TOOK_TOO_LONG_TO_PROCESS_YOUR_COMMAND',
  'APPEAL_ACCEPTED',
  'APPEAL_REJECTED',
  'BANNED_PROMPT',
  'BLOCKED',
  'BUTTON_NOT_FOUND',
  'FAILED_TO_PROCESS_YOUR_COMMAND',
  'FAILED_TO_REQUEST',
  'IMAGE_BLOCKED',
  'INTERNAL_ERROR',
  'INVALID_LINK',
  'INVALID_PARAMETER',
  'JOB_ACTION_RESTRICTED',
  'JOB_QUEUED',
  'MODERATION_OUTAGE',
  'NO_FAST_HOURS',
  'PLEASE_SUBSCRIBE_TO_MJ_IN_YOUR_DASHBOARD',
  'QUEUE_FULL',
];
const invalidUserActionList = [
  'BANNED_PROMPT',
  'BLOCKED',
  'IMAGE_BLOCKED',
  'INVALID_LINK',
  'INVALID_PARAMETER',
  'JOB_ACTION_RESTRICTED',
  'MODERATION_OUTAGE',
];
