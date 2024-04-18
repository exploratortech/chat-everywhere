import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { unauthorizedResponse } from '@/utils/server/auth';
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

const supabase = getAdminSupabaseClient();

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const BUCKET_NAME = process.env.GCP_CHAT_WITH_DOCUMENTS_BUCKET_NAME as string;
const PROJECT_ID = process.env.GCP_BUCKET_PROJECT_ID as string;
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
    const lastMessage = messages.pop();

    // TODO: update back to the original format
    const bucket_file_path = `${user.id}/supabase_tlzqgrjdkmblgtbmalki_Top SQL Statements by Total Time.pdf`;
    const filePath = `gs://${BUCKET_NAME}/${bucket_file_path}`;

    const lastMessageFormatted: Content = {
      role: lastMessage
        ? lastMessage.role === 'user'
          ? 'user'
          : 'model'
        : 'user',
      parts: lastMessage
        ? [
            {
              fileData: {
                mimeType: 'application/pdf',
                fileUri: filePath,
              },
            },
            {
              text: 'Tell me what is this file about',
            },
          ]
        : [],
    };
    const contents: Content[] = messages.map((message) => ({
      role: message.role === 'user' ? 'user' : 'model',
      parts: [{ text: message.content }],
    }));
    const systemInstruction = {
      role: 'model',
      parts: [
        {
          text: promptToSend,
        },
      ],
    };
    // TODO: add support to convert to Gemini format
    // TODO: add support for files parts

    return new Response(
      await callGeminiAPI(
        [...contents, lastMessageFormatted],
        generationConfig,
        systemInstruction,
      ),
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
    // TODO: possible bug in generationConfig, fix this later, checkout the document
    // generationConfig,
    systemInstruction,
  };

  console.log(requestPayload);

  const url = `https://${API_ENDPOINT}/v1/projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/${MODEL_ID}:streamGenerateContent`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
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

    const encoder = new TextEncoder();
    const reader = response.body.getReader();
    let partialChunk = '';

    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          partialChunk += new TextDecoder('utf-8').decode(value);
          try {
            const json = JSON.parse(partialChunk) as GenerateContentResponse[];
            json.forEach((item) => {
              if (item.candidates) {
                item.candidates.forEach((candidate) => {
                  if (candidate.content) {
                    const content = candidate.content;
                    if (content.role === 'model') {
                      const text = content.parts
                        .map((part) => part.text)
                        .join('');
                      controller.enqueue(encoder.encode(text));
                    } else {
                      console.log(
                        'Unhandled role:',
                        content.role,
                        'content:',
                        content,
                      );
                    }
                  }
                });
              }
            });
            partialChunk = ''; // Reset the partialChunk after successful parsing
          } catch (e) {
            console.log('JSON parsing error, waiting for more data:', e);
          }
        }
        controller.close();
        reader.releaseLock();
      },
    });

    return stream;
  } catch (error) {
    console.error('Failed to call Gemini API:', error);
    return null;
  }
}

// TODO: update the access token method
async function getAccessToken() {
  return 'ya29.a0Ad52N3-_wof6krw4S5otH4tqeu7rsoK_9Q63jImj20snWPeIeJ-CfkgYxdD_zTdzaF0ogv3Aai-k62KOGLvtk6Bk6bqZTQkKpSaOtw6PoC2nrh1-YXDczvug1aciuTd5Ut2WLDVhFNskA3DbfDi3cGOvh4MHTrFNDp3RdCNQUH0aCgYKAdoSARESFQHGX2MiuRN0dp_g2MLBLPRpaano9w0178';
}
