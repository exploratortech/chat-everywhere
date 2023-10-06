import { trackError } from '@/utils/server/azureAppInsights';
import { updateProAccountsPlan } from '@/utils/server/supabase';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    await updateProAccountsPlan();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error(error);
    //Log error to Azure App Insights
    trackError(error as string);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
