import { MjQueueJobComponentHandler } from '@/utils/app/streamHandler';
import { MjQueueJob, MjQueueService } from '@/utils/server/mjQueueService';

import { z } from 'zod';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const handler = async (req: Request): Promise<Response> => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // TODO: add auth validation

  const bodySchema = z.object({
    userPrompt: z.string().min(1),
  });

  let body;
  try {
    body = await req.json();
    bodySchema.parse(body);
  } catch (error) {
    return new Response('Invalid request body', { status: 400 });
  }

  const jobId = await MjQueueService.addJobToQueue(body.userPrompt);
  if (!jobId) {
    return new Response('Error', { status: 500 });
  }
  const jobInfo = await MjQueueJob.get(jobId);
  if (!jobInfo) {
    return new Response('Error', { status: 500 });
  }
  const componentGenerator = new MjQueueJobComponentHandler();
  const html = await componentGenerator.generateComponentHTML({
    job: jobInfo,
  });

  try {
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
