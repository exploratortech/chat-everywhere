import {
  type EventNameTypes,
  serverSideTrackEvent,
} from '@/utils/app/eventTracking';
import {
  getMessagesTokenCount,
  getStringTokenCount,
  shortenMessagesBaseOnTokenLimit,
} from '@/utils/server/api';

import { FunctionCall, Message } from '@/types/chat';
import { OpenAIModel, OpenAIModelID } from '@/types/openai';

import {
  AZURE_OPENAI_ENDPOINTS,
  AZURE_OPENAI_GPT_4_ENDPOINTS,
  AZURE_OPENAI_GPT_4_KEYS,
  AZURE_OPENAI_KEYS,
  OPENAI_API_HOST,
} from '../app/const';

import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';

export class OpenAIError extends Error {
  type: string;
  param: string;
  code: string;
  httpCode: number;

  constructor(
    message: string,
    type: string,
    param: string,
    code: string,
    httpCode: number,
  ) {
    super(message);
    this.name = 'OpenAIError';
    this.type = type;
    this.param = param;
    this.code = code;
    this.httpCode = httpCode;
  }
}

// Only keep role and content keys
export const normalizeMessages = (messages: Message[]) =>
  messages.map(({ role, content, name }) => ({ role, content, name }));

export const OpenAIStream = async (
  model: OpenAIModel,
  systemPrompt: string,
  temperature: number,
  messages: Message[],
  customMessageToStreamBack?: string | null, // Stream this string at the end of the streaming
  openAIPriority: boolean = false,
  userIdentifier?: string,
  eventName?: EventNameTypes | null,
) => {
  const isGPT4Model = model.id === OpenAIModelID.GPT_4;
  const [openAIEndpoints, openAIKeys] = getRandomOpenAIEndpointsAndKeys(
    isGPT4Model,
    openAIPriority,
  );

  let attempt = 0;
  let attemptLogs = '';
  const startTime = Date.now();

  while (attempt < openAIEndpoints.length) {
    const openAIEndpoint = openAIEndpoints[attempt];
    const openAIKey = openAIKeys[attempt];

    try {
      if (!openAIEndpoint || !openAIKey)
        throw new Error('Missing endpoint/key');

      attemptLogs += `Attempt ${
        attempt + 1
      }: Using endpoint ${openAIEndpoint}\n`;

      const modelName = isGPT4Model
        ? process.env.AZURE_OPENAI_GPT_4_MODEL_NAME
        : process.env.AZURE_OPENAI_MODEL_NAME;
      let url = `${openAIEndpoint}/openai/deployments/${modelName}/chat/completions?api-version=2023-06-01-preview`;
      if (openAIEndpoint.includes('openai.com')) {
        url = `${openAIEndpoint}/v1/chat/completions`;
      }

      const messagesToSend = await shortenMessagesBaseOnTokenLimit(
        systemPrompt,
        messages,
        model.tokenLimit,
        model.completionTokenLimit,
      );

      const messagesToSendInArray = [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...normalizeMessages(messagesToSend),
      ];

      const bodyToSend: any = {
        messages: messagesToSendInArray,
        max_tokens: model.completionTokenLimit,
        temperature,
        stream: true,
        presence_penalty: 0,
        frequency_penalty: 0,
      };

      const requestHeaders: { [header: string]: string } = {
        'Content-Type': 'application/json',
      };

      if (openAIEndpoint.includes('openai.com')) {
        // Use the model the user specified on the first attempt, otherwise, use
        // a fallback model.
        bodyToSend.model = attempt === 0 ? model.id : OpenAIModelID.GPT_3_5;
        requestHeaders.Authorization = `Bearer ${openAIKey}`;

        // For GPT 4 Model (Pro user)
        if (attempt !== 0 && isGPT4Model) {
          bodyToSend.model = OpenAIModelID.GPT_4;
          requestHeaders.Authorization = `Bearer ${process.env.OPENAI_API_GPT_4_KEY}`;
        }
      } else {
        requestHeaders['api-key'] = openAIKey;
      }

      const abortController = new AbortController();
      const timeout = setTimeout(() => abortController.abort(), 10000);

      console.log(`Sending request to ${url}`);
      attemptLogs += `Attempt ${attempt + 1}: Sending request to ${url}\n`;

      const res = await fetch(url, {
        headers: requestHeaders,
        method: 'POST',
        body: JSON.stringify(bodyToSend),
        signal: abortController.signal,
      });

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      if (res.status !== 200) {
        const result = await res.json();
        if (result.error) {
          console.error(
            new OpenAIError(
              result.error.message,
              result.error.type,
              result.error.param,
              result.error.code,
              res.status,
            ),
          );
          attemptLogs += `Attempt ${attempt + 1}: Error - ${
            result.error.message
          }\n`;
        } else {
          console.error(
            new Error(
              `Chat endpoint returned an error: ${
                decoder.decode(result?.value) || result.statusText
              }`,
            ),
          );

          attemptLogs += `Attempt ${
            attempt + 1
          }: Error - Chat endpoint returned an error: ${
            decoder.decode(result?.value) || result.statusText
          }\n`;
        }

        attempt += 1;
        continue;
      }

      clearTimeout(timeout);

      return new ReadableStream({
        async start(controller) {
          let buffer: Uint8Array[] = [];
          let stop = false;
          let error: any = null;
          let respondMessage = '';
          let functionCallRequired = false;
          let functionCallName = '';
          let functionCallResponseMessageInJsonString = '';

          const onParse = (event: ParsedEvent | ReconnectInterval) => {
            if (event.type === 'event') {
              const data = event.data;

              if (data === '[DONE]') {
                return;
              }

              try {
                const json = JSON.parse(data);
                if (json.choices[0]) {
                  if (json.choices[0].finish_reason != null) {
                    if (customMessageToStreamBack) {
                      buffer.push(encoder.encode(customMessageToStreamBack));
                    }
                    stop = true;
                    return;
                  }

                  const text = json.choices[0].delta.content;

                  buffer.push(encoder.encode(text));
                  respondMessage += text;
                }
              } catch (e) {
                if (!(e instanceof SyntaxError)) {
                  stop = true;
                  error = e;
                  console.error(e);
                }
              }
            }
          };

          const parser = createParser(onParse);

          const interval = setInterval(() => {
            if (buffer.length > 0) {
              const data = buffer.shift();
              controller.enqueue(data);
            }

            if (buffer.length === 0 && stop) {
              if (error) {
                controller.error(error);
              } else {
                controller.close();
              }
              clearInterval(interval);
            }
          }, 45);

          (async function () {
            for await (const chunk of res.body as any) {
              parser.feed(decoder.decode(chunk));
            }

            await logEvent({
              userIdentifier,
              eventName,
              promptMessages: messagesToSendInArray,
              completionMessage: respondMessage,
              totalDurationInMs: Date.now() - startTime,
            });

            stop = true;
          })();
        },
      });
    } catch (error) {
      attempt += 1;
      console.error(error);
      attemptLogs += `Attempt ${attempt}: Error - ${
        (error as Error).message
      }\n`;
    }
  }

  if (userIdentifier) {
    serverSideTrackEvent(userIdentifier, 'Error', {
      currentConversation: JSON.stringify(messages),
      errorMessage: attemptLogs,
    });
  }

  throw new Error('Error: Unable to make requests');
};

const logEvent = async ({
  userIdentifier,
  eventName,
  promptMessages,
  completionMessage,
  totalDurationInMs,
}: {
  userIdentifier?: string;
  eventName?: EventNameTypes | null;
  promptMessages: { role: string; content: string }[];
  completionMessage: string;
  totalDurationInMs: number;
}) => {
  if (userIdentifier && userIdentifier !== '' && eventName) {
    await serverSideTrackEvent(userIdentifier, eventName, {
      promptTokenLength: await getMessagesTokenCount(promptMessages),
      completionTokenLength: await getStringTokenCount(completionMessage),
      generationLengthInSecond: totalDurationInMs / 1000,
    });
  }
};

// Truncate log message to 4000 characters
export const truncateLogMessage = (message: string) =>
  message.length > 2000 ? `${message.slice(0, 2000)}...` : message;

// Returns a list of shuffled endpoints and keys. They should be used based
// on their order in the list.
export const getRandomOpenAIEndpointsAndKeys = (
  includeGPT4: boolean = false,
  openAIPriority: boolean,
): [(string | undefined)[], (string | undefined)[]] => {
  let endpoints: (string | undefined)[] = [...AZURE_OPENAI_ENDPOINTS];
  let keys: (string | undefined)[] = [...AZURE_OPENAI_KEYS];

  if (includeGPT4) {
    endpoints = [...AZURE_OPENAI_GPT_4_ENDPOINTS];
    keys = [...AZURE_OPENAI_GPT_4_KEYS];
  }

  for (let i = endpoints.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tempEndpoint = endpoints[i];
    const tempKey = keys[i];
    endpoints[i] = endpoints[j];
    keys[i] = keys[j];
    endpoints[j] = tempEndpoint;
    keys[j] = tempKey;
  }

  if (openAIPriority) {
    // Prioritize OpenAI endpoint
    endpoints.splice(0, 0, OPENAI_API_HOST);
    keys.splice(0, 0, process.env.OPENAI_API_KEY);
  } else {
    endpoints.push(OPENAI_API_HOST);
    keys.push(process.env.OPENAI_API_KEY);
  }

  return [endpoints, keys];
};

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
