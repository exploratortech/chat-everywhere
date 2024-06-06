import { MjQueueJobComponentHandler } from '@/utils/app/streamHandler';
import { unauthorizedResponse } from '@/utils/server/auth';
import { MjQueueJob, MjQueueService } from '@/utils/server/mjQueueService';
import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';

import { ChatBody } from '@/types/chat';
import { MjImageGenRequest } from '@/types/mjJob';

import { z } from 'zod';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const supabase = getAdminSupabaseClient();

const handler = async (req: Request): Promise<Response> => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const userToken = req.headers.get('user-token');

  const { data, error } = await supabase.auth.getUser(userToken || '');
  if (!data || error) return unauthorizedResponse;

  const user = await getUserProfile(data.user.id);
  if (!user || user.plan === 'free') return unauthorizedResponse;

  let body;
  let mjRequest: MjImageGenRequest;
  try {
    const requestBody = (await req.json()) as ChatBody;
    if (requestBody.messages.length < 1) {
      return new Response('Invalid request body', { status: 400 });
    }
    mjRequest = {
      userPrompt: requestBody.messages[requestBody.messages.length - 1].content,
      imageStyle: requestBody.imageStyle,
      imageQuality: requestBody.imageQuality,
      temperature: requestBody.temperature,
    };
  } catch (error) {
    return new Response('Invalid request body', { status: 400 });
  }

  const jobId = await MjQueueService.addJobToQueue({
    mjRequest,
    userId: user.id,
  });
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
