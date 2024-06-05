import { MjQueueService } from '@/utils/server/mjQueueService';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const handler = async (req: Request): Promise<Response> => {
  // TODO: add auth validation

  MjQueueService.processNextBatch();

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
