import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE, RESPONSE_IN_CHINESE_PROMPT } from '@/utils/app/const';
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
import { geolocation } from '@vercel/edge';

const supabase = getAdminSupabaseClient();

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
  regions: [
    'arn1',
    'bom1',
    'cdg1',
    'cle1',
    'cpt1',
    'dub1',
    'fra1',
    'gru1',
    'hnd1',
    'iad1',
    'icn1',
    'kix1',
    'lhr1',
    'pdx1',
    'sfo1',
    'sin1',
    'syd1',
  ],
};

const BUCKET_NAME = process.env.GCP_CHAT_WITH_DOCUMENTS_BUCKET_NAME as string;

const handler = async (req: Request): Promise<Response> => {
  const { country } = geolocation(req);
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
      promptToSend = DEFAULT_SYSTEM_PROMPT
    }

    if (country?.includes('TW')) {
      promptToSend += RESPONSE_IN_CHINESE_PROMPT;
    }

    let temperatureToUse = temperature;
    if (temperatureToUse == null) {
      temperatureToUse = DEFAULT_TEMPERATURE;
    }

    messageToSend = messages;

    if (selectedOutputLanguage) {
      messageToSend[
        messageToSend.length - 1
      ].content = `${selectedOutputLanguage} ${messageToSend[messageToSend.length - 1].content
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
      await callGeminiAPI({
        userIdentifier: user.id,
        contents,
        generationConfig,
        systemInstruction,
        messagesToSendInArray: messageToSend,
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_ONLY_HIGH',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_ONLY_HIGH',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_ONLY_HIGH',
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_ONLY_HIGH',
          },
        ],
      }),
    );
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
