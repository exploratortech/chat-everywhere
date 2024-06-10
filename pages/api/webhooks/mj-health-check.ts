import { MjQueueJob } from '@/utils/server/mjQueueService';

import { CompletedMjJob, FailedMjJob, ProcessingMjJob } from '@/types/mjJob';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const handleFailedStatus = async (reqBody: any) => {
  console.log('handleFailedStatus', reqBody);
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
  await MjQueueJob.update(jobId, {
    status: 'FAILED',
    reason: errorMessage,
  } as Partial<FailedMjJob>);

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

  await MjQueueJob.update(jobId, {
    status: 'COMPLETED',
    imageUrl: uri,
    buttons,
    messageId,
  } as Partial<CompletedMjJob>);
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const reqBody = await req.json();
    if (reqBody.status === 'FAILED') {
      await handleFailedStatus(reqBody);
    } else if (reqBody.status === 'PROCESSING') {
      await handleProcessingStatus(reqBody);
    } else if (reqBody.status === 'DONE') {
      await handleDoneStatus(reqBody);
    } else {
      console.log('mj-health-check webhook (other status):', reqBody);
      return new Response('', { status: 200 });
    }
  } catch (error) {
    console.log('Failed to handle request', error);
  }

  return new Response('', { status: 200 });
};

export default handler;
