import { Message } from '@/types/chat';
import { OpenAIModel, OpenAIModelID } from '@/types/openai';

import { OPENAI_API_HOST, OPENAI_API_TYPE } from '../app/const';

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
  messages.map(({ role, content }) => ({ role, content }));

export const OpenAIStream = async (
  model: OpenAIModel,
  systemPrompt: string,
  temperature: number,
  messages: Message[],
  customMessageToStreamBack?: string | null, // Stream this string at the end of the streaming
) => {
  // let url = `${OPENAI_API_HOST}/v1/chat/completions`;
  let url = `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/gpt35-16k/chat/completions?api-version=2023-06-01-preview`;

  // Ensure you have the OPENAI_API_GPT_4_KEY set in order to use the GPT-4 model
  const apiKey =
    model.id === OpenAIModelID.GPT_4
      ? process.env.OPENAI_API_GPT_4_KEY
      : process.env.OPENAI_API_KEY;

  const isGPT4Model = model.id === OpenAIModelID.GPT_4;

  const bodyToSend = {
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...normalizeMessages(messages),
    ],
    max_tokens: isGPT4Model ? 2000 : 800,
    temperature,
    stream: true,
    presence_penalty: 0,
    frequency_penalty: 0,
  };
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.AZURE_OPENAI_KEY || '',
    },
    method: 'POST',
    body: JSON.stringify(bodyToSend),
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (res.status !== 200) {
    const result = await res.json();
    if (result.error) {
      throw new OpenAIError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
        res.status,
      );
    } else {
      throw new Error(
        `OpenAI API returned an error: ${
          decoder.decode(result?.value) || result.statusText
        }`,
      );
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      let buffer: Uint8Array[] = [];
      let stop = false;

      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data;

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
            }
          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse);

      (async function () {
        for await (const chunk of res.body as any) {
          parser.feed(decoder.decode(chunk));
        }
      })();

      const interval = setInterval(() => {
        if (buffer.length > 0) {
          const data = buffer.shift();
          controller.enqueue(data);
        }
        if (stop) {
          if (buffer.length === 0) {
            controller.close();
            clearInterval(interval);
          }
        }
      }, 25);
    },
  });

  return stream;
};

// Truncate log message to 4000 characters
export const truncateLogMessage = (message: string) =>
  message.length > 4000 ? `${message.slice(0, 4000)}...` : message;
