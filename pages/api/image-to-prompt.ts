import { NextResponse } from 'next/server';

import { trackError } from '@/utils/app/azureTelemetry';
import { IMAGE_TO_PROMPT_MAX_TIMEOUT } from '@/utils/app/const';
import { ProgressHandler, makeWriteToStream } from '@/utils/app/streamHandler';
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

  const writeToStream = makeWriteToStream(writer, encoder);
  const progressHandler = new ProgressHandler(writeToStream);

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
          `https://api.thenextleg.io/v2/message/${messageId}?authToken=${process.env.THE_NEXT_LEG_API_KEY}`,
          { method: 'GET' },
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
          return;
        } else if (textGenerationProgress === null) {
          progressHandler.updateProgress({
            content: `Start to generate \n`,
          });
          textGenerationProgress = generationProgress;
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
  })();

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
};

export default handler;

// TODO: remove replaceLocalhost
function replaceLocalhost(url: string): string {
  const newHost = 'https://cd5e-27-109-204-166.ngrok-free.app/';
  return url.replace('http://localhost:54321', newHost);
}

async function nextLegDescribe(url: string) {
  const requestHeader = {
    Authorization: `Bearer ${process.env.THE_NEXT_LEG_API_KEY || ''}`,
    'Content-Type': 'application/json',
  };
  const describeResponse = await fetch(
    `https://api.thenextleg.io/v2/describe`,
    {
      method: 'POST',
      headers: requestHeader,
      body: JSON.stringify({
        // TODO: remove replaceLocalhost
        url: replaceLocalhost(url),
      }),
    },
  );
  const describeResponseJson = await describeResponse.json();
  console.log({ describeResponseJson });
  return describeResponseJson;
}
