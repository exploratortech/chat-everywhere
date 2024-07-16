import { MjQueueJobComponentHandler } from '@/utils/app/streamHandler';
import { unauthorizedResponse } from '@/utils/server/auth';
import { MjQueueJob, MjQueueService } from '@/utils/server/mjQueueService';
import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';

import type { MjButtonCommandRequest } from '@/types/mjJob';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const supabase = getAdminSupabaseClient();

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const userToken = req.headers.get('user-token');
  if (!userToken) return unauthorizedResponse;

  const { data, error } = await supabase.auth.getUser(userToken);
  if (error || !data) return unauthorizedResponse;

  const user = await getUserProfile(data.user.id);
  if (!user || user.plan === 'free') return unauthorizedResponse;

  try {
    const requestBody = (await req.json()) as Exclude<
      MjButtonCommandRequest,
      { type: 'MJ_IMAGE_GEN' }
    >;
    if (!requestBody.messageId || !requestBody.button) {
      return new Response('Invalid request body', { status: 400 });
    }
    const mjRequest = {
      type: 'MJ_BUTTON_COMMAND' as const,
      button: requestBody.button,
      messageId: requestBody.messageId,
    };

    const jobId = await MjQueueService.addJobToQueue({
      mjRequest,
      userId: user.id,
    });
    if (!jobId) throw new Error('Job ID not generated');

    const jobInfo = await MjQueueJob.get(jobId);
    if (!jobInfo) throw new Error('Job info not found');

    const componentGenerator = new MjQueueJobComponentHandler();
    const html = await componentGenerator.generateComponentHTML({
      job: jobInfo,
    });

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
