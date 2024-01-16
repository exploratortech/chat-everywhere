import { llmHandler } from '@/utils/server/functionCalls/llmHandler';
import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';

import { ChatBody } from '@/types/chat';
import { geolocation } from '@vercel/edge';

const supabase = getAdminSupabaseClient();

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const handler = async (req: Request): Promise<Response> => {
  const { country } = geolocation(req);

  const userToken = req.headers.get('user-token');
  const encoder = new TextEncoder();
  let buffer: Uint8Array[] = [];

  const { data, error } = await supabase.auth.getUser(userToken || '');
  if (!data || error || !userToken) return unauthorizedResponse;

  const user = await getUserProfile(data.user.id);
  if (!user || user.plan === 'free') return unauthorizedResponse;

  const { messages } = (await req.json()) as ChatBody;

  const sendToUser = (message: string) => {
    buffer.push(encoder.encode(message));
  };

  const stream = new ReadableStream({
    async start(controller) {
      let stop = false;
      let error: any = null;

      const interval = setInterval(() => {
        if (buffer.length > 0) {
          const data = buffer.shift();
          controller.enqueue(data);
        }

        // Only close the stream if there is no more data to send, manual stop, or no more function call is pending
        if (buffer.length === 0 && stop) {
          if (error) {
            controller.error(error);
          } else {
            controller.close();
          }
          clearInterval(interval);
        }
      }, 10);

      sendToUser('[PLACEHOLDER]');

      llmHandler({
        user,
        messages,
        onUpdate: (payload) => {
          sendToUser(payload);
        },
        onEnd: () => {
          stop = true;
        },
        countryCode: country || "",
      });
    },
  });

  return new Response(stream);
};

export default handler;
