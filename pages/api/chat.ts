// This endpoint only allow GPT-3.5 and GPT-3.5 16K models
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { OpenAIError, OpenAIStream } from '@/utils/server';
import {
  getMessagesTokenCount,
  shortenMessagesBaseOnTokenLimit,
} from '@/utils/server/api';
import { isPaidUserByAuthToken } from '@/utils/server/supabase';
import { retrieveUserSessionAndLogUsages } from '@/utils/server/usagesTracking';

import { ChatBody } from '@/types/chat';
import { OpenAIModelID, OpenAIModels } from '@/types/openai';
import { trackError } from '@/utils/server/azureAppInsights';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  retrieveUserSessionAndLogUsages(req);

  try {
    const selectedOutputLanguage = req.headers.get('Output-Language')
      ? `{lang=${req.headers.get('Output-Language')}}`
      : '';
    const { messages, prompt, temperature } = (await req.json()) as ChatBody;

    let promptToSend = prompt;
    if (!promptToSend) {
      promptToSend = DEFAULT_SYSTEM_PROMPT;
    }

    let temperatureToUse = temperature;
    if (temperatureToUse == null) {
      temperatureToUse = DEFAULT_TEMPERATURE;
    }

    const defaultTokenLimit = OpenAIModels[OpenAIModelID.GPT_3_5].tokenLimit;
    const extendedTokenLimit =
      OpenAIModels[OpenAIModelID.GPT_3_5_16K].tokenLimit;

    const requireToUseLargerContextWindowModel =
      (await getMessagesTokenCount(messages)) + 1000 > defaultTokenLimit; // Add buffer token to take system prompt into account

    const isPaidUser = await isPaidUserByAuthToken(req.headers.get('user-token'));
    const useLargerContextWindowModel =
      requireToUseLargerContextWindowModel && isPaidUser;

    const messagesToSend = await shortenMessagesBaseOnTokenLimit(
      prompt,
      messages,
      useLargerContextWindowModel ? extendedTokenLimit : defaultTokenLimit,
    );

    if (selectedOutputLanguage) {
      messagesToSend[
        messagesToSend.length - 1
      ].content = `${selectedOutputLanguage} ${
        messagesToSend[messagesToSend.length - 1].content
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
      isPaidUser,
    );

    return new Response(stream);
  } catch (error) {
    console.error(error);
    //Log error to Azure App Insights
    trackError(error as string);
    if (error instanceof OpenAIError) {
      return new Response('Error', { status: 500, statusText: error.message });
    } else {
      return new Response('Error', { status: 500 });
    }
  }
};

export default handler;
