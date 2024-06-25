import { VERCEL_EDGE_FUNCTIONS_REGIONS } from '@/utils/app/const';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { unauthorizedResponse } from '@/utils/server/auth';
import { callGeminiAPI } from '@/utils/server/google';
import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';

import { ChatBody } from '@/types/chat';
import { type Message } from '@/types/chat';

import { Content, GenerationConfig } from '@google-cloud/vertexai';

const supabase = getAdminSupabaseClient();

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
  regions: VERCEL_EDGE_FUNCTIONS_REGIONS,
};

const BUCKET_NAME = process.env.GCP_CHAT_WITH_DOCUMENTS_BUCKET_NAME as string;

const handler = async (req: Request): Promise<Response> => {
  const userToken = req.headers.get('user-token');

  const { data, error } = await supabase.auth.getUser(userToken || '');
  if (!data || error) return unauthorizedResponse;

  const user = await getUserProfile(data.user.id);
  if (!user || user.plan === 'free') return unauthorizedResponse;

  const isUserInUltraPlan = user.plan === 'ultra';

  if (!isUserInUltraPlan) {
    return new Response('Error', {
      status: 402,
      statusText: 'Not in Ultra plan',
    });
  }

  let promptToSend = '';
  let messageToSend: Message[] = [];

  try {
    const selectedOutputLanguage = req.headers.get('Output-Language')
      ? `[lang=${req.headers.get('Output-Language')}]`
      : '';

    const { messages, prompt, temperature } = (await req.json()) as ChatBody;

    promptToSend = prompt;
    if (!promptToSend) {
      promptToSend = DEFAULT_SYSTEM_PROMPT;
    }
    let temperatureToUse = temperature;
    if (temperatureToUse == null) {
      temperatureToUse = DEFAULT_TEMPERATURE;
    }

    messageToSend = messages;

    if (selectedOutputLanguage) {
      messageToSend[
        messageToSend.length - 1
      ].content = `${selectedOutputLanguage} ${
        messageToSend[messageToSend.length - 1].content
      }`;
    }

    await serverSideTrackEvent(data.user.id, 'Chat with doc message');

    // GEMINI API STARTS HERE
    const generationConfig: GenerationConfig = {
      temperature: temperatureToUse,
      topP: 0.95,
    };

    const contents: Content[] = messages.map((message, index) => {
      const role = message.role === 'user' ? 'user' : 'model';
      const textParts = [{ text: message.content }];
      const fileDataList = message.fileList
        ? message.fileList.map((file) => ({
            fileData: {
              mimeType: file.filetype,
              fileUri: `gs://${BUCKET_NAME}/${file.objectPath}`,
            },
          }))
        : [];
      return {
        role,
        parts: [...fileDataList, ...textParts],
      };
    });

    if (contents.length > 0 && contents?.[0]?.role !== 'user') {
      // This is custom prompt, we need to add user role to avoid 'multiturn requests error'
      contents.unshift({
        role: 'user',
        parts: [
          {
            text: '👋',
          },
        ],
      });
    }

    const systemInstruction = {
      role: 'model',
      parts: [
        {
          text: promptToSend,
        },
      ],
    };

    return new Response(
      await callGeminiAPI(
        user.id,
        contents,
        generationConfig,
        systemInstruction,
        messageToSend,
      ),
    );
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
