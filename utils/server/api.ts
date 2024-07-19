import type { EventNameTypes } from '@/utils/app/eventTracking';
import { serverSideTrackEvent } from '@/utils/app/eventTracking';

import type { Message } from '@/types/chat';

// @ts-expect-error
import * as wasm from '../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module';
import {
  AZURE_DALL_E_3_ENDPOINTS,
  AZURE_DALL_E_API_KEYS,
  AZURE_OPENAI_ENDPOINTS,
  AZURE_OPENAI_GPT_4_ENDPOINTS,
  AZURE_OPENAI_GPT_4_KEYS,
  AZURE_OPENAI_KEYS,
} from '../app/const';
import { getTokenCountForPrompt } from './google';

import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json';
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init';
import type { Content } from '@google-cloud/vertexai';

const tokenCounterBuffer = 100;

const getEncodingInstance = async () => {
  await init((imports) => WebAssembly.instantiate(wasm, imports));
  return new Tiktoken(
    tiktokenModel.bpe_ranks,
    tiktokenModel.special_tokens,
    tiktokenModel.pat_str,
  );
};

export const shortenMessagesBaseOnTokenLimit = async (
  prompt: string,
  messages: Message[],
  tokenLimit: number,
  completionTokens: number = 2000, // Number of tokens to reserve for completion, the max_token params in the API
): Promise<Message[]> => {
  const encoding = await getEncodingInstance();

  const promptTokens = encoding.encode(prompt);

  let tokenCount = promptTokens.length;
  let messagesToSend: Message[] = [];

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const tokens = encoding.encode(message.content);

    if (
      tokenCount + tokens.length + completionTokens + tokenCounterBuffer >
      tokenLimit
    ) {
      break;
    }
    tokenCount += tokens.length;
    messagesToSend = [message, ...messagesToSend];
  }

  if (messagesToSend.length === 0) {
    // Shorten the last message if it's too long
    const lastMessage = messages[messages.length - 1];
    let shortenedMessageContent = '';
    for (let i = 0; i < lastMessage.content.length; i++) {
      const char = lastMessage.content[i];
      const tokens = encoding.encode(char);

      if (
        tokenCount + tokens.length + completionTokens + tokenCounterBuffer >
        tokenLimit
      ) {
        break;
      }
      tokenCount += tokens.length;
      shortenedMessageContent += char;
    }
    encoding.free();
    return [
      {
        ...lastMessage,
        content: shortenedMessageContent,
      },
    ];
  } else {
    encoding.free();
    return messagesToSend;
  }
};

export const trimStringBaseOnTokenLimit = async (
  string: string,
  tokenLimit: number,
): Promise<string> => {
  const encoding = await getEncodingInstance();

  let tokenCount = 0;
  let shortenedString = '';

  if (!string || string.length === 0) {
    return shortenedString;
  }

  for (let i = 0; i < string.length; i++) {
    const char = string[i];
    const tokens = encoding.encode(char);

    if (tokenCount > tokenLimit) {
      break;
    }
    tokenCount += tokens.length;
    shortenedString += char;
  }

  encoding.free();
  return shortenedString;
};

export const getMessagesTokenCount = async (
  messages: Message[] | { role: string; content: string }[],
): Promise<number> => {
  const encoding = await getEncodingInstance();

  let tokenCount = 0;
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const tokens = encoding.encode(message.content);
    tokenCount += tokens.length;
  }

  return tokenCount;
};

export const getStringTokenCount = async (string: string): Promise<number> => {
  const encoding = await getEncodingInstance();

  const tokens = encoding.encode(string);
  return tokens.length;
};

// Returns an array of all endpoints and keys. Japan endpoint will be prioritized if requestCountryCode is TW/HK/MO (disabled for now due to instability)
export const getEndpointsAndKeys = (
  includeGPT4: boolean = false,
): [(string | undefined)[], (string | undefined)[]] => {
  const endpoints: (string | undefined)[] = includeGPT4
    ? [...AZURE_OPENAI_GPT_4_ENDPOINTS]
    : [...AZURE_OPENAI_ENDPOINTS];
  const keys: (string | undefined)[] = includeGPT4
    ? [...AZURE_OPENAI_GPT_4_KEYS]
    : [...AZURE_OPENAI_KEYS];

  const shuffled = shuffleEndpointsAndKeys([...endpoints], [...keys], 1);
  const filteredEndpoints = shuffled.endpoints.filter(
    (endpoint) => endpoint !== undefined,
  );
  const filteredKeys = shuffled.keys.filter((key) => key !== undefined);

  return [filteredEndpoints, filteredKeys];
};

export const getDalle3EndpointAndKeys = (): {
  endpoint: string | undefined;
  key: string | undefined;
} => {
  const endpoint =
    AZURE_DALL_E_3_ENDPOINTS[
      Math.floor(Math.random() * AZURE_DALL_E_3_ENDPOINTS.length)
    ];
  const keyIndex = AZURE_DALL_E_3_ENDPOINTS.indexOf(endpoint);
  const key = AZURE_DALL_E_API_KEYS[keyIndex];

  return { endpoint, key };
};

const shuffleEndpointsAndKeys = (
  endpoints: (string | undefined)[],
  keys: (string | undefined)[],
  shuffleProbability: number,
): { endpoints: (string | undefined)[]; keys: (string | undefined)[] } => {
  if (Math.random() < shuffleProbability) {
    const shuffledIndices = Array.from(Array(endpoints.length).keys()).sort(
      () => Math.random() - 0.5,
    );
    return {
      endpoints: shuffledIndices.map((index) => endpoints[index]),
      keys: shuffledIndices.map((index) => keys[index]),
    };
  }
  return { endpoints, keys };
};

// Truncate log message to 4000 characters
export const truncateLogMessage = (message: string) =>
  message.length > 2000 ? `${message.slice(0, 2000)}...` : message;

export const authorizedOpenAiRequest = async (
  url: string,
  options: RequestInit = {},
) => {
  const headers = {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    'OpenAI-Beta': 'assistants=v1',
    'Content-Type': 'application/json',
    ...options.headers,
  };
  return fetch(url, { ...options, headers });
};

export const logEvent = async ({
  userIdentifier,
  eventName,
  promptMessages,
  completionMessage,
  totalDurationInMs,
  timeToFirstTokenInMs,
  endpoint,
  geminiRequestPayload,
  geminiFinalPayload,
}: {
  userIdentifier?: string;
  eventName?: EventNameTypes | null;
  promptMessages: { role: string; content: string }[];
  completionMessage: string;
  totalDurationInMs: number;
  timeToFirstTokenInMs: number;
  endpoint?: string;
  geminiRequestPayload?: {
    contents: Content[];
    system_instruction: Content;
  };
  geminiFinalPayload?: {
    contents: Content[];
    system_instruction: Content;
  };
}) => {
  if (userIdentifier && userIdentifier !== '' && eventName) {
    let promptTokenLength = 0;
    let completionTokenLength = 0;
    if (geminiRequestPayload && geminiFinalPayload) {
      const [promptTokenLengthPromise, totalTokenLengthPromise] =
        await Promise.all([
          getTokenCountForPrompt(geminiRequestPayload),
          getTokenCountForPrompt(geminiFinalPayload),
        ]);
      promptTokenLength = promptTokenLengthPromise;
      completionTokenLength = totalTokenLengthPromise - promptTokenLength;
    } else {
      const [promptTokenLengthPromise, completionTokenLengthPromise] =
        await Promise.all([
          getMessagesTokenCount(promptMessages),
          getStringTokenCount(completionMessage),
        ]);
      promptTokenLength = promptTokenLengthPromise;
      completionTokenLength = completionTokenLengthPromise;
    }
    console.log({
      promptTokenLength,
      completionTokenLength,
    });

    await serverSideTrackEvent(userIdentifier, eventName, {
      promptTokenLength: promptTokenLength,
      completionTokenLength: completionTokenLength,
      generationLengthInSecond: totalDurationInMs / 1000,
      timeToFirstTokenInMs,
      tokenPerSecond: Math.round(
        completionTokenLength / (totalDurationInMs / 1000),
      ),
      endpoint,
    });
  }
};
