import { getHomeUrl } from '@/utils/app/api';
import { MjQueueJob } from '@/utils/server/mjQueueService';

import { z } from 'zod';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const jobIdSchema = z.string().min(1);

  let jobId;
  try {
    jobId = jobIdSchema.parse(req.headers.get('job-id'));
  } catch (error) {
    return new Response('Invalid job id', { status: 400 });
  }

  const jobInfo = await MjQueueJob.get(jobId);

  if (!jobInfo) {
    return new Response('No job found', { status: 404 });
  }

  switch (jobInfo.status) {
    case 'QUEUED':
      const host = getHomeUrl();
      fetch(`${host}/api/mj-queue/process`);
      return new Response(JSON.stringify(jobInfo), { status: 200 });
    case 'PROCESSING':
      return new Response(JSON.stringify(jobInfo), { status: 200 });
    case 'COMPLETED':
      // No longer need the job after return to frontend
      MjQueueJob.remove(jobId);
      return new Response(JSON.stringify(jobInfo), { status: 200 });
    case 'FAILED':
      // No longer need the job after return to frontend
      MjQueueJob.remove(jobId);
      return new Response(JSON.stringify(jobInfo), { status: 200 });
    default:
      return new Response('Invalid status', { status: 400 });
  }
};

export default handler;
