import { NextResponse } from 'next/server';

import { trackError } from '@/utils/app/azureTelemetry';
import {
  DEFAULT_IMAGE_GENERATION_QUALITY,
  DEFAULT_IMAGE_GENERATION_STYLE,
  IMAGE_GEN_MAX_TIMEOUT,
} from '@/utils/app/const';
import { MJ_INVALID_USER_ACTION_LIST } from '@/utils/app/mj_const';
import {
  ProgressHandler,
  makeCreateImageSelector,
  makeWriteToStream,
} from '@/utils/app/streamHandler';
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

  const writeToStream = makeWriteToStream(writer, encoder);
  const createImageSelector = makeCreateImageSelector(writeToStream);
  const progressHandler = new ProgressHandler(writeToStream);

  const requestBody = (await req.json()) as ChatBody;

  progressHandler.updateProgress({
    content: 'Initializing ... \n',
  });
  progressHandler.updateProgress({
    content:
      'This feature is still in Beta, please expect some non-ideal images and report any issue to admin. Thanks. \n',
  });

  const latestUserPromptMessage =
    requestBody.messages[requestBody.messages.length - 1].content;

  const imageGeneration = async () => {
    const requestHeader = {
      Authorization: `Bearer ${process.env.THE_NEXT_LEG_API_KEY || ''}`,
      'Content-Type': 'application/json',
    };

    try {
      // Translate and enhance the prompt
      progressHandler.updateProgress({
        content: `Enhancing and translating user input prompt ... \n`,
      });
      generationPrompt = await translateAndEnhancePrompt(
        latestUserPromptMessage,
      );

      generationPrompt = generateMjPrompt(
        generationPrompt,
        requestBody.imageStyle,
        requestBody.imageQuality,
        requestBody.temperature,
      );

      progressHandler.updateProgress({
        content: `Prompt: ${generationPrompt} \n`,
        removeLastLine: true,
      });
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
      console.log({ imageGenerationResponseJson });

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
      let imageGenerationProgress: null | number = null;

      const getTotalGenerationTime = () =>
        Math.round((Date.now() - generationStartedAt) / 1000);

      while (
        !jobTerminated &&
        (Date.now() - generationStartedAt < IMAGE_GEN_MAX_TIMEOUT * 1000 ||
          (imageGenerationProgress && imageGenerationProgress < 100))
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

        console.log({ imageGenerationProgressResponseJson });
        if (generationProgress === 100) {
          const buttonMessageId =
            imageGenerationProgressResponseJson.response.buttonMessageId;
          progressHandler.updateProgress({
            content: `Completed in ${getTotalGenerationTime()}s \n`,
            state: 'completed',
          });

          const imageUrl =
            imageGenerationProgressResponseJson.response.imageUrl;
          const imageUrlList =
            imageGenerationProgressResponseJson.response.imageUrls;
          const imageAlt = latestUserPromptMessage
            .replace(/\s+/g, '-')
            .slice(0, 20);

          if (!imageUrl || !imageUrlList.length) {
            // run when image url is available
            const mjResponseContent =
              imageGenerationProgressResponseJson.response.content;
            const isInvalidUserAction =
              mjResponseContent &&
              MJ_INVALID_USER_ACTION_LIST.includes(mjResponseContent);
            if (isInvalidUserAction) {
              progressHandler.updateProgress({
                content: `Error: ${mjResponseContent} \n`,
                state: 'error',
              });

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
            await createImageSelector({
              previousButtonCommand: '',
              buttonMessageId,
              imageList: imageUrlList.map(
                (imageUrl: string, index: number) => ({
                  imageUrl: imageUrl,
                  imageAlt: imageAlt,
                  buttons: [`U${index + 1}`, `V${index + 1}`],
                }),
              ),
            });
            await addUsageEntry(PluginID.IMAGE_GEN, user.id);
            await subtractCredit(user.id, PluginID.IMAGE_GEN);

            imageGenerationProgress = 100;

            await writeToStream('[DONE]');
            writer.close();
            return;
          }
        } else {
          if (imageGenerationProgress === null) {
            progressHandler.updateProgress({
              content: `Start to generate \n`,
            });
          } else {
            progressHandler.updateProgress({
              content: `${
                generationProgress === 0
                  ? 'Waiting to be processed'
                  : `${generationProgress}% complete`
              } ... ${getTotalGenerationTime()}s \n`,
              removeLastLine: true,
              percentage:
                typeof generationProgress === 'number'
                  ? `${generationProgress}`
                  : undefined,
            });
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
      //Log error to Azure App Insights
      trackError(error as string);
      await progressHandler.updateProgress({
        content:
          'Error occurred while generating image, please try again later.',
        state: 'error',
      });

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
