import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { OpenAIError, OpenAIStream } from '@/utils/server';
import {
  addCredit,
  addUsageEntry,
  getAdminSupabaseClient,
  getUserProfile,
  hasUserRunOutOfCredits,
  subtractCredit,
} from '@/utils/server/supabase';

import { ChatBody } from '@/types/chat';
import { type Message } from '@/types/chat';
import { OpenAIModelID, OpenAIModels } from '@/types/openai';
import { PluginID } from '@/types/plugin';

const supabase = getAdminSupabaseClient();

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const handler = async (req: Request): Promise<Response> => {
  const userToken = req.headers.get('user-token');

  const { data, error } = await supabase.auth.getUser(userToken || '');
  if (!data || error) return unauthorizedResponse;

  const user = await getUserProfile(data.user.id);
  if (!user || user.plan === 'free') return unauthorizedResponse;

  const isUserInUltraPlan = user.plan === 'ultra';

  if (
    !isUserInUltraPlan &&
    (await hasUserRunOutOfCredits(data.user.id, PluginID.GPT4))
  ) {
    return new Response('Error', {
      status: 402,
      statusText: 'Ran out of GPT-4 credit',
    });
  }

  let promptToSend = '';
  let messageToSend: Message[] = [];

  try {
    const selectedOutputLanguage = req.headers.get('Output-Language')
      ? `{lang=${req.headers.get('Output-Language')}}`
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

    if(!isUserInUltraPlan){
      await addUsageEntry(PluginID.GPT4, data.user.id);
      await subtractCredit(data.user.id, PluginID.GPT4);
    }

    const stream = await OpenAIStream(
      OpenAIModels[OpenAIModelID.GPT_4],
      promptToSend,
      temperatureToUse,
      messageToSend,
      null,
      false,
      data.user.id,
      'GPT4 mode message',
    );

    return new Response(stream);
  } catch (error) {
    console.error(error);
    if (
      error instanceof Error &&
      error.message.includes('maximum context length')
    ) {
      return new Response('Error', {
        status: 500,
        statusText: error.message,
      });
    }
    serverSideTrackEvent(data.user.id, 'Error', {
      currentConversation: JSON.stringify(messageToSend),
      messageToSend: promptToSend,
      errorMessage: error ? (error as Error).message : 'unknown error',
    });

    if (error instanceof OpenAIError) {
      switch (error.httpCode) {
        case 429:
          try {
            // Add credit back to user's account
            if(!isUserInUltraPlan) await addCredit(data.user.id, PluginID.GPT4, 1);
          } catch (error) {
            // Handle error adding credit back
            return new Response('Error adding credit back', {
              status: 500,
              statusText: 'Internal Server Error',
            });
          }
          // Return 429 error to user
          return new Response('OpenAI API Error', {
            status: 429,
            statusText: 'OpenAI API Error',
          });
        default:
          // Return error message to user
          return new Response('Error', {
            status: 500,
            statusText: error.message,
          });
      }
    } else {
      return new Response('Error', { status: 500 });
    }
  }
};

export default handler;
