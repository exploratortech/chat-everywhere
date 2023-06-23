import { batchRefreshReferralCodes } from '../../../utils/server/supabase';

export const config = {
  runtime: 'edge',
};

// TODO: move to cron job
const handler = async (req: Request): Promise<Response> => {
  try {
    await batchRefreshReferralCodes();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
