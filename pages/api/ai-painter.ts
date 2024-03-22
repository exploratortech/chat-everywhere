import { generateComponentHTML } from '@/utils/app/htmlStringHandler';
import { aiPainterLlmHandler } from '@/utils/server/functionCalls/aiPainterllmHandler';
import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';

import { ChatBody } from '@/types/chat';

import AiPainterProgress from '@/components/Chat/components/AiPainterProgress';

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

  const chatbody = (await req.json()) as ChatBody;
  const { messages, prompt } = chatbody;

  const sendToUser = (message: string) => {
    buffer.push(encoder.encode(message));
  };

  const sendLoadingMessage = async (message: string) => {
    const html = await generateComponentHTML({
      component: AiPainterProgress,
      props: {
        content: message,
        state: 'loading',
      },
      temp: true,
    });
    sendToUser(html);
  };
  const sendErrorMessage = async (message: string) => {
    const html = await generateComponentHTML({
      component: AiPainterProgress,
      props: {
        content: message,
        state: 'error',
      },
    });
    sendToUser(html);
  };

  const stream = new ReadableStream({
    async start(controller) {
      let stop = false;
      let error: any = null;

      // Set an interval to send a placeholder message every 10 seconds
      const placeholderInterval = setInterval(() => {
        if (!stop) {
          // Only send if the stop flag hasn't been set
          sendToUser('[PLACEHOLDER]');
          console.log('========== placeholder interval sent');
        }
      }, 10000); // 10 seconds

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
          clearInterval(placeholderInterval);
          console.log('========== cleared interval for ai-painter');
        }
      }, 10);

      sendToUser('[PLACEHOLDER]');

      const promptToSend = prompt || '';
      aiPainterLlmHandler({
        user,
        messages,
        prompt: promptToSend,
        onUpdate: (payload) => {
          sendToUser(payload);
        },
        onProgressUpdate: (payload) => {
          if (payload.type === 'result') {
            sendToUser(payload.content);
          } else {
            sendLoadingMessage(payload.content);
          }
        },
        onErrorUpdate: (payload) => {
          sendErrorMessage(payload);
        },
        onEnd: () => {
          sendToUser('[REMOVE_TEMP_HTML]\n');
          stop = true;
        },
        countryCode: country || '',
      });
    },
  });

  return new Response(stream);
};

export default handler;
