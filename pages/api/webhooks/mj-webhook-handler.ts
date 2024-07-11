import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { MjQueueJob } from '@/utils/server/mjQueueService';
import {
  OriginalMjLogEvent,
  trackFailedEvent,
  trackSuccessEvent,
} from '@/utils/server/mjServiceServerHelper';
import { addCredit, getUserProfile } from '@/utils/server/supabase';

import { CompletedMjJob, FailedMjJob, ProcessingMjJob } from '@/types/mjJob';
import { PluginID } from '@/types/plugin';

import dayjs from 'dayjs';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const handleFailedStatus = async (reqBody: any) => {
  const messageId = reqBody.messageId || 'N/A';
  const errorMessage = reqBody.error || 'N/A';
  const prompt = reqBody.prompt || 'N/A';

  const webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
  let slackMessage = 'Midjourney generation Error:\n';

  if (messageId !== 'N/A') {
    slackMessage += `Message ID: ${messageId}\n`;
  }
  if (prompt !== 'N/A') {
    slackMessage += `Prompt: ${prompt}\n`;
  }
  if (errorMessage !== 'N/A') {
    slackMessage += `Error: ${errorMessage}`;
  }

  // Update JobInfo
  const jobId = reqBody.ref;
  const jobInfo = await MjQueueJob.get(jobId);
  if (!jobInfo) {
    return;
  }

  const trackEventPromise = trackFailedEvent(jobInfo, errorMessage);
  const updateJobPromise = MjQueueJob.update(jobId, {
    status: 'FAILED',
    reason: errorMessage,
  } as Partial<FailedMjJob>);

  const logOriginalEventPromise = OriginalMjLogEvent({
    userId: jobInfo.userId,
    startTime: jobInfo.startProcessingAt || jobInfo.enqueuedAt,
    errorMessage: errorMessage,
    promptBeforeProcessing:
      jobInfo.mjRequest.type === 'MJ_BUTTON_COMMAND'
        ? jobInfo.mjRequest.button
        : jobInfo.mjRequest.userPrompt,
    generationPrompt:
      jobInfo.mjRequest.type === 'MJ_BUTTON_COMMAND'
        ? jobInfo.mjRequest.button
        : jobInfo.mjRequest.enhancedPrompt,
    usedOnDemandCredit: jobInfo.status !== 'QUEUED' ? !!(jobInfo.usedOnDemandCredit) : false,
  });

  await Promise.all([
    trackEventPromise,
    updateJobPromise,
    logOriginalEventPromise,
    handleAddBackUserCredit(jobInfo.userId),
  ]);

  // Send to Slack
  const slackPayload = {
    text: slackMessage,
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackPayload),
    });
  } catch (error) {
    console.error('Failed to send Slack notification', error);
  }
};

const handleProcessingStatus = async (reqBody: any) => {
  const progress = reqBody.progress;
  const jobId = reqBody.ref;
  if (!jobId) {
    console.error('handleProcessingStatus: jobId is not found');
    return;
  }
  if (!progress) {
    console.error('handleProcessingStatus: progress is not found');
    return;
  }
  const imageUrl = reqBody.uri;

  await MjQueueJob.update(jobId, {
    status: 'PROCESSING',
    progress,
    imageUrl: imageUrl || '',
  } as Partial<ProcessingMjJob>);
};

const handleDoneStatus = async (reqBody: any) => {
  const jobId = reqBody.ref;
  const uri = reqBody.uri;
  const buttons = reqBody.buttons;
  const messageId = reqBody.messageId;
  const progress = reqBody.progress;

  const jobInfo = await MjQueueJob.get(jobId);
  if (!jobInfo) {
    return;
  }

  const trackEventPromise = trackSuccessEvent(jobInfo);
  const logOriginalEventPromise = OriginalMjLogEvent({
    userId: jobInfo.userId,
    startTime: jobInfo.startProcessingAt || jobInfo.enqueuedAt,
    promptBeforeProcessing:
      jobInfo.mjRequest.type === 'MJ_BUTTON_COMMAND'
        ? jobInfo.mjRequest.button
        : jobInfo.mjRequest.userPrompt,
    generationPrompt:
      jobInfo.mjRequest.type === 'MJ_BUTTON_COMMAND'
        ? jobInfo.mjRequest.button
        : jobInfo.mjRequest.enhancedPrompt,
    usedOnDemandCredit: jobInfo.status !== 'QUEUED' ? !!(jobInfo.usedOnDemandCredit) : false,
  });

  const updateJobPromise = MjQueueJob.update(jobId, {
    status: 'COMPLETED',
    imageUrl: uri,
    buttons,
    messageId,
    progress,
  } as Partial<CompletedMjJob>);

  await Promise.all([
    trackEventPromise,
    updateJobPromise,
    logOriginalEventPromise,
  ]);

  // Track original PostHog Event
  const originalJobInfo = await MjQueueJob.get(jobId);
  if (!originalJobInfo) {
    return;
  }
  if (originalJobInfo.mjRequest.type === 'MJ_BUTTON_COMMAND') {
    const now = dayjs().valueOf();
    const totalDurationInSeconds =
      (now - dayjs(jobInfo.enqueuedAt).valueOf()) / 1000;

    await serverSideTrackEvent(
      originalJobInfo.userId,
      'AI image button clicked',
      {
        aiImageButtonCommand: originalJobInfo.mjRequest.button,
        generationLengthInSecond: totalDurationInSeconds,
      },
    );
  }
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const reqBody = await req.json();
    if (reqBody.status === 'FAIL' || reqBody.status === 'FAILED') {
      await handleFailedStatus(reqBody);
    } else if (reqBody.status === 'PROCESSING') {
      await handleProcessingStatus(reqBody);
    } else if (reqBody.status === 'DONE') {
      await handleDoneStatus(reqBody);
    } else {
      return new Response('', { status: 200 });
    }
  } catch (error) {
    console.log('Failed to handle request', error);
  }

  return new Response('', { status: 200 });
};

export default handler;

async function handleAddBackUserCredit(userId: string) {
  try {
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User profile not found');
    }
    if (userProfile.plan === 'pro') {
      addCredit(userId, PluginID.IMAGE_GEN, 1);
    }
  } catch (error) {
    console.error('Failed to handle add back user credit', error);
  }
}
