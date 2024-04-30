import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { unauthorizedResponse } from '@/utils/server/auth';
import { getAccessToken } from '@/utils/server/google/auth';
import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';

import { ChatBody } from '@/types/chat';
import { type Message } from '@/types/chat';

import {
  Content,
  GenerateContentResponse,
  GenerationConfig,
} from '@google-cloud/vertexai';
import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';

const supabase = getAdminSupabaseClient();

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const BUCKET_NAME = process.env.GCP_CHAT_WITH_DOCUMENTS_BUCKET_NAME as string;
const PROJECT_ID = process.env.GCP_PROJECT_ID as string;
const API_ENDPOINT = 'us-east1-aiplatform.googleapis.com';
const LOCATION_ID = 'us-east1';
const MODEL_ID = 'gemini-1.5-pro-preview-0409';

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

    // GEMINI API STARTS HERE
    const generationConfig: GenerationConfig = {
      temperature: temperatureToUse,
      topP: 0.95,
    };

    const contents: Content[] = messages.map((message) => {
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
    const systemInstruction = {
      role: 'model',
      parts: [
        {
          text: promptToSend,
        },
      ],
    };

    return new Response(
      await callGeminiAPI(contents, generationConfig, systemInstruction),
    );
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;

async function callGeminiAPI(
  contents: Content[],
  generationConfig: GenerationConfig,
  systemInstruction: Content,
) {
  const requestPayload = {
    contents,
    generationConfig,
    systemInstruction,
  };

  const access_token = await getAccessToken();
  const url = `https://${API_ENDPOINT}/v1/projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/${MODEL_ID}:streamGenerateContent?alt=sse`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const result = await response.json();
      console.log({ result });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const contentType = response.headers.get('Content-Type');
    // Check if the response is a streaming response

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const onParse = async (event: ParsedEvent | ReconnectInterval) => {
          if (event.type === 'event') {
            const data = event.data;

            try {
              if (data === '[DONE]') {
                controller.close();
                return;
              }

              const json = JSON.parse(data) as GenerateContentResponse;
              json?.candidates?.forEach((item) => {
                const content = item.content;
                if (content.role === 'model') {
                  const text = content.parts.map((part) => part.text).join('');
                  controller.enqueue(encoder.encode(text));
                } else {
                  console.log(
                    'Unhandled role:',
                    content.role,
                    'content:',
                    content,
                  );
                }
                if (item.finishReason && item.finishReason === 'STOP') {
                  controller.close();
                }
              });
            } catch (e) {
              console.error(e);
              controller.error(e);
            }
          }
        };

        const parser = createParser(onParse);

        for await (const chunk of response.body as any) {
          parser.feed(decoder.decode(chunk));
        }
      },
    });

    return stream;
  } catch (error) {
    console.error('Failed to call Gemini API:', error);
    return null;
  }
}