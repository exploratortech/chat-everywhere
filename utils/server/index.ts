import { Logger } from 'next-axiom';

import { ERROR_MESSAGES } from '@/utils/app/const';
import {
  type EventNameTypes,
  serverSideTrackEvent,
} from '@/utils/app/eventTracking';
import { shortenMessagesBaseOnTokenLimit } from '@/utils/server/api';
import { getEndpointsAndKeys, logEvent } from '@/utils/server/api';

import { Message } from '@/types/chat';
import { OpenAIModel, OpenAIModelID } from '@/types/openai';

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
  userIdentifier?: string,
  eventName?: EventNameTypes | null,
  requestCountryCode?: string,
) => {
  const log = new Logger();

  const isGPT4Model = model.id === OpenAIModelID.GPT_4;
  const [openAIEndpoints, openAIKeys] = getEndpointsAndKeys(
    isGPT4Model,
    requestCountryCode,
  );

  let attempt = 0;
  let attemptLogs = '';
  const requestStartTime = Date.now();
  let timeToFirstTokenInMs = 0;
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

      let url = `${openAIEndpoint}/openai/deployments/${model.deploymentName}/chat/completions?api-version=2024-02-01`;
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
        if (result.error.code === 'content_filter') {
          throw new Error(ERROR_MESSAGES.content_filter_triggered.message);
        }
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

          console.error(result.error);

          log.error('OpenAIStream error', {
            message: result.error,
          });

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

          const onParse = (event: ParsedEvent | ReconnectInterval) => {
            if (event.type === 'event') {
              const data = event.data;

              if (data === '[DONE]') {
                return;
              }

              if (timeToFirstTokenInMs === 0) {
                timeToFirstTokenInMs = Date.now() - requestStartTime;
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

                  const text = json.choices[0]?.delta?.content || '';

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

          // Dynamically adjust stream speed base on the model
          let bufferTime = 10;
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
          }, bufferTime);

          (async function () {
            for await (const chunk of res.body as any) {
              parser.feed(decoder.decode(chunk, { stream: true }));
            }

            await logEvent({
              userIdentifier,
              eventName,
              promptMessages: messagesToSendInArray,
              completionMessage: respondMessage,
              totalDurationInMs: Date.now() - startTime,
              timeToFirstTokenInMs,
              endpoint: openAIEndpoint,
            });

            stop = true;
          })();
        },
      });
    } catch (error) {
      attempt += 1;
      console.error(error, attemptLogs);

      // Propagate custom error to terminate the retry mechanism
      if (
        (error as Error).message ===
        ERROR_MESSAGES.content_filter_triggered.message
      ) {
        throw new Error(ERROR_MESSAGES.content_filter_triggered.message);
      }

      log.error('api/chat error', {
        message: (error as Error).message,
        errorObject: error,
        attemptLogs,
      });

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
