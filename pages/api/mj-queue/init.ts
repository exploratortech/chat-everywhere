import { MjQueueJobComponentHandler } from '@/utils/app/streamHandler';
import { unauthorizedResponse } from '@/utils/server/auth';
import { MjQueueJob, MjQueueService } from '@/utils/server/mjQueueService';
import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';

import { MjImageGenRequest } from '@/types/mjJob';

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
    const requestBody = (await req.json()) as Omit<MjImageGenRequest, 'type'>;
    const mjRequest = {
      type: 'MJ_IMAGE_GEN' as const,
      userPrompt: requestBody.userPrompt,
      imageStyle: requestBody.imageStyle,
      imageQuality: requestBody.imageQuality,
      temperature: requestBody.temperature,
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
