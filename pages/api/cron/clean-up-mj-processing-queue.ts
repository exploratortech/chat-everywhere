import { MjQueueJob } from '@/utils/server/mjQueueService';

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
    const cleanedUpProcessingJobs = await MjQueueJob.cleanUpProcessingJobs();

    return new Response(
      JSON.stringify({ success: true, cleanedUpProcessingJobs }),
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
