import { MjQueueService } from '@/utils/server/mjQueueService';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const handler = async (): Promise<Response> => {
  await MjQueueService.processNextBatch();

  try {
    return new Response(JSON.stringify({}), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
