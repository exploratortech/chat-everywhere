// This serverless function is responsible for generating an image for a message
// and storing it in the thread.
// Refer to README_v2.md for workflow breakdown
import type { NextApiRequest, NextApiResponse } from 'next';

import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { generateDallEImage } from '@/utils/server/functionCalls/imageGeneration';
import { getAdminSupabaseClient } from '@/utils/server/supabase';
import {
  submitToolOutput,
  updateMetadataOfMessage,
  waitForRunToComplete,
} from '@/utils/v2Chat/openAiApiUtils';

import type { OpenAIRunType, v2ConversationType } from '@/types/v2Chat/chat';

interface RequestBody {
  threadId: string;
  runId: string;
  messageId: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }

  const authToken = req.headers['auth-token'];

  if (authToken !== process.env.THREAD_RUNNER_AUTH_TOKEN) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { threadId, runId, messageId } = req.body as RequestBody;
  console.log(
    'Thread runner endpoint is hit with threadId, runId, messageId ',
    threadId,
    runId,
    messageId,
  );

  if (!threadId || !runId || !messageId) {
    res.status(400).json({ error: 'Missing threadId or runId or messageId' });
    return;
  }

  const supabase = getAdminSupabaseClient();
  const startTime = Date.now();

  const { data: threadData } = await supabase
    .from('user_v2_conversations')
    .select('*')
    .eq('threadId', threadId)
    .single();

  if (!threadData) {
    res.status(404).json({ error: 'Thread not found' });
    return;
  }

  const thread = threadData as v2ConversationType;
  let run: OpenAIRunType;

  if (thread.processLock) {
    res.status(200).json({ error: 'Thread is locked' });
    return;
  }

  try {
    run = await waitForRunToComplete(threadId, runId, true, 180 * 1000); // Max 3 mins for run to execute
  } catch (e) {
    console.error("Run didn't complete in 3 mins, failed");
    await setThreadRunInProgress(threadId, false);
    await setThreadProcessLock(threadId, false);
    res.status(200).json({ error: 'Run unable to complete' });
    return;
  }

  try {
    if (['completed', 'failed', 'expired'].includes(run.status)) {
      await setThreadRunInProgress(threadId, false);
      await setThreadProcessLock(threadId, false);
      res.status(200).json({ error: 'Run completed' });
      return;
    }

    const requiredAction = run.required_action;

    if (!requiredAction) {
      await setThreadRunInProgress(threadId, false);
      await setThreadProcessLock(threadId, false);
      res.status(200).json({ error: 'Run does not require action' });
      return;
    }

    const toolCalls = requiredAction.submit_tool_outputs.tool_calls;
    if (!toolCalls || !messageId) {
      await setThreadRunInProgress(threadId, false);
      await setThreadProcessLock(threadId, false);
      res
        .status(400)
        .json({ error: 'Tool call or Message with runID is not found' });
      return;
    }

    let imageGenerated = false;
    for (const toolCall of toolCalls) {
      if (toolCall.function.name === 'generate_image') {
        if (imageGenerated) {
          await submitToolOutput(
            threadId,
            runId,
            toolCall.id,
            'Only one image is allowed per message',
          );
        }

        serverSideTrackEvent(thread.uid, 'v2 Image generation request', {
          v2ThreadId: thread.threadId,
          v2MessageId: messageId,
          v2runId: run.id,
        });

        try {
          const prompt = JSON.parse(toolCall.function.arguments).prompt;
          const imageObject = await generateDallEImage({
            prompt,
            messageId: messageId,
            threadId: thread.threadId,
          });
          serverSideTrackEvent('N/A', 'v2 Image generation processed', {
            v2ImageGenerationUrl: imageObject.imagePublicUrl,
            v2ImageGenerationDurationInMS: Date.now() - startTime,
          });
          imageGenerated = true;
          await submitToolOutput(
            threadId,
            runId,
            toolCall.id,
            "Successfully generated image, image is displayed on user's screen. The revised prompt is (Do not show this to user unless explicit ask by the user): " +
              imageObject.imageRevisedPrompt,
          );
        } catch (e: any) {
          const error = e as Error;
          console.log('Error during image generation: ', error.message);

          await updateMetadataOfMessage(threadId, messageId, {
            imageGenerationStatus: 'failed',
            imageGenerationError: e.message,
          });

          await submitToolOutput(
            threadId,
            runId,
            toolCall.id,
            'Unable to generate image. Due to: ' + error.message,
          );
        }
        await waitForRunToComplete(threadId, runId, false, 120 * 1000);
      }
    }

    await setThreadRunInProgress(threadId, false);
    await setThreadProcessLock(threadId, false);
    console.log('Run completed');
    res.status(200).end();
  } catch (error) {
    // Update meta data in message
    if (threadId && messageId) {
      await updateMetadataOfMessage(threadId, messageId, {
        imageGenerationStatus: 'failed',
      });
    }
    await waitForRunToComplete(threadId, runId, false, 120 * 1000);

    serverSideTrackEvent('N/A', 'v2 Error', {
      errorMessage: 'Thread-handler error' + error,
    });

    await setThreadRunInProgress(threadId, false);
    await setThreadProcessLock(threadId, false);
    console.error(error);
    res.status(500).json({ error: 'Thread-handler error' });
    return;
  }
}

const setThreadRunInProgress = async (
  conversationId: string,
  runInProgress: boolean,
) => {
  const supabase = getAdminSupabaseClient();
  await supabase
    .from('user_v2_conversations')
    .update({
      runInProgress,
    })
    .eq('threadId', conversationId);
};

const setThreadProcessLock = async (
  conversationId: string,
  processLock: boolean,
) => {
  const supabase = getAdminSupabaseClient();
  await supabase
    .from('user_v2_conversations')
    .update({
      processLock,
    })
    .eq('threadId', conversationId);
};
