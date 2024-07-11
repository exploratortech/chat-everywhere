// This endpoint only allow GPT-3.5 and GPT-3.5 16K models
import { Logger } from 'next-axiom';

import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE, RESPONSE_IN_CHINESE_PROMPT } from '@/utils/app/const';
import { ERROR_MESSAGES } from '@/utils/app/const';
import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { OpenAIError, OpenAIStream } from '@/utils/server';
import {
  getMessagesTokenCount,
  getStringTokenCount,
  shortenMessagesBaseOnTokenLimit,
} from '@/utils/server/api';
import { isPaidUserByAuthToken } from '@/utils/server/supabase';
import { retrieveUserSessionAndLogUsages } from '@/utils/server/usagesTracking';

import { ChatBody } from '@/types/chat';
import { type Message } from '@/types/chat';
import { OpenAIModelID, OpenAIModels } from '@/types/openai';

import { geolocation } from '@vercel/edge';

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

const handler = async (req: Request): Promise<Response> => {
  retrieveUserSessionAndLogUsages(req);
  const { country, city } = geolocation(req);
  // TODO:Remove this
  console.log("User country code is " + country);
  console.log("User city is " + city);


  const log = new Logger();
  const userIdentifier = req.headers.get('user-browser-id');
  const pluginId = req.headers.get('user-selected-plugin-id');
  let messagesToSend: Message[] = [];
  let promptToSend = '';

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

    const defaultTokenLimit = OpenAIModels[OpenAIModelID.GPT_3_5].tokenLimit;
    const extendedTokenLimit =
      OpenAIModels[OpenAIModelID.GPT_3_5_16K].tokenLimit;

    const requireToUseLargerContextWindowModel =
      (await getMessagesTokenCount(messages)) +
      (await getStringTokenCount(promptToSend)) +
      1000 >
      defaultTokenLimit;

    const isPaidUser = await isPaidUserByAuthToken(
      req.headers.get('user-token'),
    );
    const useLargerContextWindowModel =
      requireToUseLargerContextWindowModel && isPaidUser;

    messagesToSend = await shortenMessagesBaseOnTokenLimit(
      prompt,
      messages,
      useLargerContextWindowModel ? extendedTokenLimit : defaultTokenLimit,
    );

    if (selectedOutputLanguage) {
      messagesToSend[
        messagesToSend.length - 1
      ].content = `${selectedOutputLanguage} ${messagesToSend[messagesToSend.length - 1].content
      }`;
    }

    // Stream back 16k option or already being applied
    let messageToStreamBack: string | null = null;

    if (useLargerContextWindowModel) {
      messageToStreamBack = '[16K]';
    } else if (requireToUseLargerContextWindowModel) {
      messageToStreamBack = '[16K-Optional]';
    }

    const stream = await OpenAIStream(
      useLargerContextWindowModel
        ? OpenAIModels[OpenAIModelID.GPT_3_5_16K]
        : OpenAIModels[OpenAIModelID.GPT_3_5],
      promptToSend,
      temperatureToUse,
      messagesToSend,
      messageToStreamBack,
      userIdentifier || undefined,
      pluginId === '' ? 'Default mode message' : null,
      country,
    );

    return new Response(stream);
  } catch (error) {
    if (
      (error as Error).message ===
      ERROR_MESSAGES.content_filter_triggered.message
    ) {
      return new Response('Error', {
        status: ERROR_MESSAGES.content_filter_triggered.httpCode,
      });
    }
    console.error(error);

    log.error('api/chat error', {
      message: (error as Error).message,
      errorObject: error,
    });

    serverSideTrackEvent(userIdentifier || 'not-defined', 'Error', {
      PluginId: pluginId || 'not-defined',
      currentConversation: JSON.stringify(messagesToSend),
      messageToSend: promptToSend,
      errorMessage: error ? (error as Error).message : 'unknown error',
    });

    if (error instanceof OpenAIError) {
      return new Response('Error', { status: 500, statusText: error.message });
    } else {
      return new Response('Error', { status: 500 });
    }
  }
};

export default handler;
