import type {
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

const WAITING_QUEUE_KEY = 'mj_waiting_queue';
const JOB_INFO_KEY = 'mj_job_info';
const PROCESSING_QUEUE_KEY = 'mj_processing_jobs';

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

    // Transaction
    const transaction = redis.multi();

    transaction.rpush(WAITING_QUEUE_KEY, jobId);
    const newJob: Omit<QueuedMjJob, 'position'> = {
      jobId,
      status: 'QUEUED',
      enqueuedAt,
      userId,
      mjRequest,
    };
    transaction.hset(`${JOB_INFO_KEY}:${jobId}`, newJob);

    await transaction.exec();

    console.log(`added jobId ${jobId} to queue`);
    return jobId;
  },
  processNextBatch: async () => {
    const maxCapacity = 20;
    // Using lua script to make sure the queue is atomic
    const script = `
      -- Get the maximum capacity, current timestamp, and TTL from arguments
      local maxCapacity = tonumber(ARGV[1])
      local currentTime = tonumber(ARGV[2])
      local ttl = tonumber(ARGV[3])

      -- Remove expired jobs from the processing queue to avoid the redis delay
      redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, currentTime)

      -- Get the current count of jobs in the processing queue
      local processingCount = redis.call('ZCARD', KEYS[1])

      -- Calculate the available capacity
      local availableCapacity = maxCapacity - processingCount

      -- Initialize an empty table to store the job IDs
      local jobIds = {}

      -- If there is available capacity, move jobs from waiting to processing queue
      if availableCapacity > 0 then
        for i = 1, availableCapacity do
          -- Pop a job ID from the waiting queue
          local jobId = redis.call('LPOP', KEYS[2])

          -- If there are no more jobs in the waiting queue, exit the loop
          if not jobId then
            break
          end

          -- Add the job ID to the processing queue with an expiration timestamp
          redis.call('ZADD', KEYS[1], currentTime + ttl, jobId)

          -- Insert the job ID into the jobIds table
          table.insert(jobIds, jobId)
        end
      end

      -- Return the table of job IDs
      return jobIds
    `;

    const keys = [PROCESSING_QUEUE_KEY, WAITING_QUEUE_KEY];
    const currentTime = Math.floor(Date.now() / 1000);
    const ttl = 300; // TTL of 5 minutes (300 seconds)
    const args = [
      maxCapacity.toString(),
      currentTime.toString(),
      ttl.toString(),
    ];
    const jobIds = (await redis.eval(script, keys, args)) as string[];

    if (Array.isArray(jobIds) && jobIds.length > 0) {
      const tasks = jobIds.map((jobId) => {
        const func = async () => {
          const host = getHomeUrl();
          await MjQueueJob.markProcessing(jobId, 0);
          await fetch(`${host}/api/image-gen-v2`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jobId,
            }),
          });
        };
        return func;
      });

      await Promise.all(tasks.map((task) => task()));
    } else {
      console.log(
        'No jobs processed, either due to processing limit or empty queue.',
      );
    }
  },
  removeFromWaitingQueue: async (jobId: string) => {
    await redis.lrem(WAITING_QUEUE_KEY, 0, jobId);
  },
  removeFromProcessingSet: async (jobId: string) => {
    await redis.zrem(PROCESSING_QUEUE_KEY, jobId);
  },
};

export const MjQueueJob = {
  get: async (jobId: string): Promise<MjJob | null> => {
    const jobInfo = await redis.hgetall(`${JOB_INFO_KEY}:${jobId}`);
    if (!jobInfo) return null;

    if (jobInfo.status === 'QUEUED') {
      const queueList = await redis.lrange(WAITING_QUEUE_KEY, 0, -1);
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
    if (content.status === 'COMPLETED' || content.status === 'FAILED') {
      await MjQueueService.removeFromProcessingSet(jobId);
    }
  },
  remove: async (jobId: string) => {
    // remove from job info
    await redis.del(`${JOB_INFO_KEY}:${jobId}`);
    // remove from both waiting queue and processing
    await MjQueueService.removeFromWaitingQueue(jobId);
    await MjQueueService.removeFromProcessingSet(jobId);
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

    const cleanByJobKey = async (jobKey: string) => {
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
    };

    const tasks = jobKeys.map(cleanByJobKey);

    await Promise.all(tasks);

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
