import { NextResponse } from 'next/server';

import { IMAGE_TO_PROMPT_MAX_TIMEOUT } from '@/utils/app/const';
import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import {
  MjProgressProgressHandler,
  makeWriteToStream,
} from '@/utils/app/streamHandler';
import { getAdminSupabaseClient } from '@/utils/server/supabase';

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

  const { url } = await req.json();

  if (!url) return new Response('Missing URL', { status: 400 });

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const startTime = Date.now();

  const writeToStream = makeWriteToStream(writer, encoder);
  const progressHandler = new MjProgressProgressHandler(writeToStream);

  let jobTerminated = false;

  progressHandler.updateProgress({
    content: 'Initializing ... \n',
  });

  (async () => {
    try {
      // Call Describe
      const describeResponseJson = await nextLegDescribe(url);
      const { messageId } = describeResponseJson;

      // Get progress
      progressHandler.updateProgress({
        content: `Transferring image to prompt ... \n`,
      });
      // Check every 3.5 seconds if the image generation is done
      let generationStartedAt = Date.now();
      let textGenerationProgress: null | number = null;

      const getTotalGenerationTime = () =>
        Math.round((Date.now() - generationStartedAt) / 1000);

      while (
        !jobTerminated &&
        (Date.now() - generationStartedAt <
          IMAGE_TO_PROMPT_MAX_TIMEOUT * 1000 ||
          (textGenerationProgress && textGenerationProgress < 100))
      ) {
        await sleep(3500);
        const generationProgressResponse = await fetch(
          `https://api.mymidjourney.ai/api/v1/midjourney/message/${messageId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${process.env.MY_MIDJOURNEY_API_KEY}`,
            },
          },
        );
        if (!generationProgressResponse.ok) {
          console.log(await generationProgressResponse.status);
          console.log(await generationProgressResponse.text());
          throw new Error(
            'Unable to fetch image to prompt generation progress',
          );
        }
        const generationProgressResponseJson =
          await generationProgressResponse.json();
        console.log({ generationProgressResponseJson });
        const { progress: generationProgress } = generationProgressResponseJson;
        console.log({ generationProgress });

        if (generationProgress === 100) {
          progressHandler.updateProgress({
            content: `Completed in ${getTotalGenerationTime()}s \n`,
            state: 'completed',
          });
          const result = generationProgressResponseJson?.response?.content as
            | string[]
            | undefined;
          await writeToStream('[DONE]');
          if (result) {
            await writeToStream(`### Prompt: \n\n` + result.join('\n') + '\n');
          } else {
            await writeToStream(
              'Unable to finish the image to prompt generation, please try again later.',
            );
          }
          writer.close();
          serverSideTrackEvent(data.user.id, 'AI image to prompt', {
            generationLengthInSecond: (Date.now() - startTime) / 1000,
          });
          return;
        } else if (textGenerationProgress === null) {
          progressHandler.updateProgress({
            content: `Start to generate \n`,
            removeLastLine: true,
          });
          textGenerationProgress = generationProgress || 0;
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
          textGenerationProgress = generationProgress;
        }
      }
      await writeToStream('[DONE]');
      await writeToStream(
        'Unable to finish the image to prompt generation, please try again later.',
      );
      writer.close();
      return;
    } catch (error) {
      jobTerminated = true;

      console.error(error);
      await progressHandler.updateProgress({
        content:
          'Error occurred while generating image, please try again later.',
        state: 'error',
      });

      await writeToStream('[DONE]');
      writer.close();
      return;
    }
  })();

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
};

export default handler;

// This function is for local development only to replace localhost with ngrok host
// function replaceLocalhost(url: string): string {
//   const ngrokHost = 'YOUR NGROK HOST';
//   const localSupabaseHost = 'YOUR SUPABASE LOCAL HOST';
//   return url.replace(localSupabaseHost, ngrokHost );
// }

async function nextLegDescribe(url: string) {
  const requestHeader = {
    Authorization: `Bearer ${process.env.MY_MIDJOURNEY_API_KEY || ''}`,
    'Content-Type': 'application/json',
  };
  const describeResponse = await fetch(
    `https://api.mymidjourney.ai/api/v1/midjourney/describe`,
    {
      method: 'POST',
      headers: requestHeader,
      body: JSON.stringify({
        // This line is for local development only to replace localhost with ngrok host
        // url: replaceLocalhost(url),
        url: url,
      }),
    },
  );
  const describeResponseJson = await describeResponse.json();
  console.log({ describeResponseJson });
  return describeResponseJson;
}
