import { NextResponse } from 'next/server';

import { IMAGE_GEN_MAX_TIMEOUT } from '@/utils/app/const';
import { MJ_INVALID_USER_ACTION_LIST } from '@/utils/app/mj_const';
import buttonCommand from '@/utils/server/next-lag/buttonCommands';
import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';

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

  const requestBody = await req.json();

  const { button, buttonMessageId } = requestBody;

  const upscalePattern = /^U\d$/i;
  const isUpscaleCommand = upscalePattern.test(button);

  console.log({
    button,
    isUpscaleCommand: isUpscaleCommand,
  });
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

  let jobTerminated = false;
  const writeToStream = async (text: string, removeLastLine?: boolean) => {
    if (removeLastLine) {
      await writer.write(encoder.encode('[REMOVE_LAST_LINE]'));
    }
    await writer.write(encoder.encode(text));
  };
  // ==================== STREAM CONFIG END ====================

  const generationStartedAt = Date.now();
  let imageGenerationProgress: null | number = null;
  const getTotalGenerationTime = () =>
    Math.round((Date.now() - generationStartedAt) / 1000);
  writeToStream('```MJImage \n');
  writeToStream(`Command: ${button} ... \n`);
  writeToStream(
    'This feature is still in Beta, please expect some non-ideal images and report any issue to admin. Thanks. \n',
  );

  const imageGeneration = async () => {
    while (
      !jobTerminated &&
      (Date.now() - generationStartedAt < IMAGE_GEN_MAX_TIMEOUT * 1000 ||
        (imageGenerationProgress && imageGenerationProgress < 100))
    ) {
      await sleep(3500);
      const imageGenerationProgressResponse = await fetch(
        `https://api.thenextleg.io/v2/message/${messageId}?authToken=${process.env.THE_NEXT_LEG_API_KEY}`,
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
        writeToStream(`Completed in ${getTotalGenerationTime()}s \n`);
        writeToStream('``` \n');

        const imageUrl = imageGenerationProgressResponseJson.response.imageUrl;
        const buttons = imageGenerationProgressResponseJson.response.buttons;
        const imageUrlList =
          imageGenerationProgressResponseJson.response.imageUrls;

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
          if (isUpscaleCommand) {
            writeToStream(
              `\n\n<div id="mj-image-upscaled">${`<image src="${imageUrl}" alt="${imageAlt}" data-ai-image-buttons="${buttons.join(
                ',',
              )}" data-ai-image-button-message-id="${buttonMessageId}" data-ai-image-button-commands-executed="0" />`}</div>\n\n`,
            );
          } else {
            writeToStream(
              `\n\n<div id="mj-image-selection" class="grid grid-cols-2 gap-0">${imageUrlList
                .map(
                  (imageUrl: string, index: number) =>
                    `<image src="${imageUrl}" alt="${imageAlt}" data-ai-image-buttons="U${
                      index + 1
                    },V${
                      index + 1
                    }" data-ai-image-button-message-id="${buttonMessageId}" data-ai-image-button-commands-executed="0" />`,
                )
                .join('')}</div>\n\n`,
            );
          }

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
  };

  try {
    imageGeneration();

    // Check every 3.5 seconds if the image generation is done
  } catch (error) {
    jobTerminated = true;

    console.error(error);
    writeToStream(
      'Error occurred while generating image, please try again later.',
    );
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
