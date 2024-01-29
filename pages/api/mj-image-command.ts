import { NextResponse } from 'next/server';

import { IMAGE_GEN_MAX_TIMEOUT } from '@/utils/app/const';
import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { MJ_INVALID_USER_ACTION_LIST } from '@/utils/app/mj_const';
import {
  ProgressHandler,
  makeCreateImageSelectorV2,
  makeWriteToStream,
} from '@/utils/app/streamHandler';
import buttonCommand from '@/utils/server/next-lag/buttonCommands';
import {
  addUsageEntry,
  getAdminSupabaseClient,
  getUserProfile,
  subtractCredit,
} from '@/utils/server/supabase';

import { PluginID } from '@/types/plugin';

const supabase = getAdminSupabaseClient();

export const config = {
  runtime: 'edge',
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const handler = async (req: Request): Promise<Response> => {
  const userToken = req.headers.get('user-token');

  const { data, error } = await supabase.auth.getUser(userToken || '');
  if (!data || error) return unauthorizedResponse;

  const user = await getUserProfile(data.user.id);
  if (!user || user.plan === 'free') return unauthorizedResponse;

  const isUserInUltraPlan = user.plan === 'ultra';

  const requestBody = await req.json();

  const { button, buttonMessageId, prompt } = requestBody;

  const upscalePattern = /^U\d$/i;
  const isUpscaleCommand = upscalePattern.test(button);

  const buttonCommandResponse = await buttonCommand(button, buttonMessageId);
  const messageId = buttonCommandResponse.messageId;
  console.log({
    buttonCommandResponse,
  });

  // GET PROGRESS AND STREAM IT BACK TO THE USER
  // ==================== STREAM CONFIG START ====================
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const startTime = Date.now();

  let jobTerminated = false;
  const writeToStream = makeWriteToStream(writer, encoder);

  // ==================== STREAM CONFIG END ====================

  const generationStartedAt = Date.now();
  let imageGenerationProgress: null | number = null;
  const getTotalGenerationTime = () =>
    Math.round((Date.now() - generationStartedAt) / 1000);

  const createImageSelector = makeCreateImageSelectorV2(writeToStream);
  const progressHandler = new ProgressHandler(writeToStream);

  progressHandler.updateProgress({ content: `Command: ${button} ... \n` });
  progressHandler.updateProgress({
    content:
      'This feature is still in Beta, please expect some non-ideal images and report any issue to admin. Thanks. \n',
  });

  const imageGeneration = async () => {
    while (
      !jobTerminated &&
      (Date.now() - generationStartedAt < IMAGE_GEN_MAX_TIMEOUT * 1000 ||
        (imageGenerationProgress && imageGenerationProgress < 100))
    ) {
      await sleep(3500);
      const generationProgressEndpoint = `https://api.mymidjourney.ai/api/v1/midjourney/message/${messageId}`;
      const imageGenerationProgressResponse = await fetch(
        generationProgressEndpoint,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${process.env.MY_MIDJOURNEY_API_KEY}`,
          },
        },
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
        const finalResponse: {
          prompt: string;
          uri: string;
          progress: number;
          buttons: string[];
          messageId: string;
          createdAt: string;
          updatedAt: string;
        } = imageGenerationProgressResponseJson;
        const buttonMessageId = finalResponse.messageId;

        progressHandler.updateProgress({
          content: `Completed in ${getTotalGenerationTime()}s \n`,
          state: 'completed',
        });

        const imageUrl = finalResponse.uri;
        const imageUrlList = new Array(4).fill(imageUrl);

        const buttons = finalResponse.buttons;

        const imageAlt = 'Upscaled image';

        if (
          !imageUrl ||
          !buttons ||
          !Array.isArray(buttons) ||
          !buttons.length
        ) {
          // run when image url is available
          const mjResponseContent =
            imageGenerationProgressResponseJson.response.content;
          const isInvalidUserAction =
            mjResponseContent &&
            MJ_INVALID_USER_ACTION_LIST.includes(mjResponseContent);
          if (isInvalidUserAction) {
            progressHandler.updateProgress({
              content: `Upscale failed, please try again with a different image. \n`,
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
          if (isUpscaleCommand) {
            await createImageSelector({
              previousButtonCommand: button,
              buttonMessageId,
              imageUrl,
              buttons,
              prompt: prompt || '',
            });
          } else {
            await createImageSelector({
              previousButtonCommand: button,
              buttonMessageId,
              imageUrl,
              buttons,
              prompt: prompt || '',
            });
          }

          // only upscale command will not be charged
          if (!isUpscaleCommand && !isUserInUltraPlan) {
            await addUsageEntry(PluginID.IMAGE_GEN, user.id);
            await subtractCredit(user.id, PluginID.IMAGE_GEN);
          }

          imageGenerationProgress = 100;

          await writeToStream('[DONE]');
          writer.close();
          await serverSideTrackEvent(data.user.id, 'AI image button clicked', {
            aiImageButtonCommand: button,
            generationLengthInSecond: (Date.now() - startTime) / 1000,
          });
          return;
        }
      } else {
        if (imageGenerationProgress === null) {
          progressHandler.updateProgress({
            content: `Start to generate \n`,
            removeLastLine: true
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
  };

  try {
    imageGeneration();

    // Check every 3.5 seconds if the image generation is done
  } catch (error) {
    jobTerminated = true;

    console.error(error);
    progressHandler.updateProgress({
      content: 'Error occurred while generating image, please try again later.',
      state: 'error',
    });
    writeToStream('[DONE]');
    writer.close();
  }
  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
};

export default handler;
