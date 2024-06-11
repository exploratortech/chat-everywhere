import {
  CompletedMjJob,
  FailedMjJob,
  MjJob,
  MjRequest,
  ProcessingMjJob,
  QueuedMjJob,
} from '@/types/mjJob';

import { getHomeUrl } from '../app/api';
import redis from './upstashRedisClient';

import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

const QUEUE_KEY = 'mj_waiting_queue';
const JOB_INFO_KEY = 'mj_job_info';
const PROCESSING_KEY = 'mj_processing_jobs';

export const MjQueueService = {
  addJobToQueue: async ({
    userId,
    mjRequest,
  }: {
    userId: string;
    mjRequest: MjRequest;
  }): Promise<QueuedMjJob['jobId']> => {
    const enqueuedAt = dayjs().toISOString();
    const jobId = uuidv4();

    await redis.rpush(QUEUE_KEY, jobId);

    const newJob: Omit<QueuedMjJob, 'position'> = {
      jobId,
      status: 'QUEUED',
      enqueuedAt,
      userId,
      mjRequest,
    };
    await redis.hset(`${JOB_INFO_KEY}:${jobId}`, newJob);

    console.log(`added jobId ${jobId} to queue`);
    return jobId;
  },
  processNextBatch: async () => {
    // Using lua script to make sure the queue is atomic
    const script = `
    local maxCapacity = 5  -- Define the maximum capacity of processing jobs
    local processingCount = redis.call('SCARD', KEYS[1])
    local availableCapacity = maxCapacity - processingCount
    local jobIds = {}
    if availableCapacity > 0 then
        for i = 1, availableCapacity do
            local jobId = redis.call('LPOP', KEYS[2])  -- Pop a job ID from the waiting queue
            if not jobId then  -- If no job ID is found, break the loop
                break
            end
            redis.call('SADD', KEYS[1], jobId)  -- Add the job ID to the processing set
            table.insert(jobIds, jobId)
        end
    end
    return jobIds  -- Return the list of job IDs that will be processed
  `;
    const keys = [PROCESSING_KEY, QUEUE_KEY, JOB_INFO_KEY];
    const args = [] as unknown[]; // No additional arguments are needed for this script
    const jobIds = (await redis.eval(script, keys, args)) as string[];
    if (Array.isArray(jobIds) && jobIds.length > 0) {
      for (const jobId of jobIds) {
        await MjQueueJob.markProcessing(jobId, 0);

        const host = getHomeUrl();
        fetch(`${host}/api/image-gen-v2`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobId,
          }),
        });
      }
    } else {
      console.log(
        'No jobs processed, either due to processing limit or empty queue.',
      );
    }
  },
};

export const MjQueueJob = {
  get: async (jobId: string): Promise<MjJob | null> => {
    const jobInfo = await redis.hgetall(`${JOB_INFO_KEY}:${jobId}`);
    if (!jobInfo) return null;

    if (jobInfo.status === 'QUEUED') {
      const queueList = await redis.lrange(QUEUE_KEY, 0, -1);
      let position = queueList.indexOf(jobId);
      if (position === -1) {
        return null;
      } else {
        return {
          ...jobInfo,
          position,
        } as QueuedMjJob;
      }
    }

    return jobInfo as unknown as MjJob;
  },
  update: async (jobId: string, content: Partial<MjJob>) => {
    // Convert content to a format compatible with Redis hset
    const redisCompatibleContent = Object.fromEntries(
      Object.entries(content).map(([key, value]) => [
        key,
        JSON.stringify(value),
      ]),
    );
    await redis.hset(`${JOB_INFO_KEY}:${jobId}`, redisCompatibleContent);
  },
  remove: async (jobId: string) => {
    // remove from job info
    await redis.del(`${JOB_INFO_KEY}:${jobId}`);
    // remove from both queue and processing
    await redis.lrem(QUEUE_KEY, 0, jobId);
    await redis.srem(PROCESSING_KEY, jobId);
  },
  markProcessing: async (
    jobId: ProcessingMjJob['jobId'],
    progress: ProcessingMjJob['progress'],
  ) => {
    await redis.hset(`${JOB_INFO_KEY}:${jobId}`, {
      status: 'PROCESSING',
      progress,
      startProcessingAt: dayjs().toISOString(),
    });
  },
  markFailed: async (
    jobId: FailedMjJob['jobId'],
    reason: FailedMjJob['reason'],
  ) => {
    await redis.hset(`${JOB_INFO_KEY}:${jobId}`, {
      status: 'FAILED',
      reason,
    });
  },
  // Clean up processing jobs that have been in the processing state for more than 5 minutes
  cleanUpProcessingJobs: async () => {
    const fiveMinutesAgo = dayjs().subtract(5, 'minute');

    // Get all keys that match the pattern 'mj_job_info:*'
    const jobKeys = await redis.keys(`${JOB_INFO_KEY}:*`);
    if (!jobKeys || jobKeys.length === 0) return;

    const cleanedUpJobs: (ProcessingMjJob & {
      fiveMinutesAgo: string;
    })[] = [];
    for (const jobKey of jobKeys) {
      const jobData = await redis.hgetall(jobKey);

      const job = jobData as unknown as MjJob;

      if (
        job.status === 'PROCESSING' &&
        dayjs(job.enqueuedAt).isBefore(dayjs(fiveMinutesAgo))
      ) {
        const jobId = jobKey.split(':')[1];
        await MjQueueJob.remove(jobId);
        cleanedUpJobs.push({
          ...job,
          fiveMinutesAgo: fiveMinutesAgo.toISOString(),
        });
      }
    }
    return cleanedUpJobs;
  },

  // Clean up completed and failed jobs that are older than 7 days
  cleanUpCompletedAndFailedJobs: async () => {
    const oneWeekAgo = dayjs().subtract(7, 'day');

    // Get all keys that match the pattern 'mj_job_info:*'
    const jobKeys = await redis.keys(`${JOB_INFO_KEY}:*`);
    if (!jobKeys || jobKeys.length === 0) return;

    const cleanedUpJobs: ((CompletedMjJob | FailedMjJob) & {
      oneWeekAgo: string;
    })[] = [];
    for (const jobKey of jobKeys) {
      const jobData = await redis.hgetall(jobKey);
      const job = jobData as unknown as MjJob;
      if (
        (job.status === 'COMPLETED' || job.status === 'FAILED') &&
        dayjs(job.enqueuedAt).isBefore(oneWeekAgo)
      ) {
        const jobId = jobKey.split(':')[1];
        await MjQueueJob.remove(jobId);
        cleanedUpJobs.push({
          ...job,
          oneWeekAgo: oneWeekAgo.toISOString(),
        });
      }
    }
    return cleanedUpJobs;
  },
};
