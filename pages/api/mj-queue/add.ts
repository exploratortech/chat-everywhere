import { MjQueueJobComponentHandler } from '@/utils/app/streamHandler';
import { MjQueueJob, MjQueueService } from '@/utils/server/mjQueueService';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const handler = async (req: Request): Promise<Response> => {
  // TODO: add auth validation

  const jobId = await MjQueueService.addJobToQueue();
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
