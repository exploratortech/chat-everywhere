import { addJobToQueue } from '@/utils/server/mjQueueService';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const handler = async (req: Request): Promise<Response> => {
  const jobId = addJobToQueue();

  try {
    return new Response(JSON.stringify(jobId), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
