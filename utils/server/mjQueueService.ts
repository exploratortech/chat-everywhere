import redis from './upstashRedisClient';

import { v4 as uuidv4 } from 'uuid';

const QUEUE_KEY = 'priority_queue';
const QUEUE_INFO_KEY = 'queue_info';

type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

interface BasedMjJob {
  jobId: string;
  status: JobStatus;
  enqueuedAt: string;
}
interface QueuedMjJob extends BasedMjJob {
  status: 'QUEUED';
  position: number;
}
interface ProcessingMjJob extends BasedMjJob {
  status: 'PROCESSING';
  progress: number;
}
interface CompletedMjJob extends BasedMjJob {
  status: 'COMPLETED';
  imageUrl: string;
}
interface FailedMjJob extends BasedMjJob {
  status: 'FAILED';
  reason: string;
}
type MjJob = QueuedMjJob | ProcessingMjJob | CompletedMjJob | FailedMjJob;

export async function addJobToQueue(): Promise<QueuedMjJob['jobId']> {
  const enqueuedAt = new Date().toISOString();
  const jobId = uuidv4();

  await redis.rpush(QUEUE_KEY, jobId);

  await redis.hset(`${QUEUE_INFO_KEY}:${jobId}`, {
    jobId,
    status: 'QUEUED',
    enqueuedAt,
  });

  console.log(`added jobId ${jobId} to queue`);
  return jobId;
}

export async function getJob(jobId: string): Promise<MjJob | null> {
  const queueList = await redis.lrange(QUEUE_KEY, 0, -1);
  const position = queueList.indexOf(jobId);
  console.log({
    jobId,
    position,
  });
  if (position === -1) return null;

  const jobInfo = await redis.hgetall(`${QUEUE_INFO_KEY}:${jobId}`);
  console.log({
    jobInfo,
  });
  if (!jobInfo) return null;
  return jobInfo as unknown as MjJob;
}

export async function processNextJob() {
  const jobId = await redis.lpop(QUEUE_KEY); // Pop from the beginning
  if (jobId) {
    console.log(`Processing jobId ${jobId}`);

    await redis.hset(`${QUEUE_INFO_KEY}:${jobId}`, { status: 'PROCESSING' });

    // TODO: Sleep for 10 seconds, replace to callback instead
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(`Job ${jobId} processed, Now removing from queue`);

    await redis.del(`${QUEUE_INFO_KEY}:${jobId}`);
    console.log(`Job ${jobId} removed from queue`);
  }
}
