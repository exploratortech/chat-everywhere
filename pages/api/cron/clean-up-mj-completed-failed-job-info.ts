import { MjQueueJob } from '@/utils/server/mjQueueService';
import { trackCleanupJobEvent } from '@/utils/server/mjServiceServerHelper';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export const config = {
  runtime: 'edge',
};

const handler = async (): Promise<Response> => {
  try {
    const executionTime = dayjs().toISOString();
    const cleanedUpCompletedAndFailedJobs =
      await MjQueueJob.cleanUpCompletedAndFailedJobs();

    if (cleanedUpCompletedAndFailedJobs) {
      const trackEventPromises = cleanedUpCompletedAndFailedJobs.map(
        (jobDetail) =>
          trackCleanupJobEvent({
            event: 'MJ Queue Cleanup Completed / Failed Job',
            executedAt: executionTime,
            enqueuedAt: jobDetail.enqueuedAt,
            oneWeekAgo: jobDetail.oneWeekAgo,
          }),
      );
      await Promise.all(trackEventPromises);
    }

    return new Response(
      JSON.stringify({ success: true, cleanedUpCompletedAndFailedJobs }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
