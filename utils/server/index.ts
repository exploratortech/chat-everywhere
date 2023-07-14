import { Message } from '@/types/chat';
import { OpenAIModel, OpenAIModelID } from '@/types/openai';

import { OPENAI_API_HOST, OPENAI_API_TYPE } from '../app/const';
import { CALLABLE_FUNCTIONS } from '../app/callableFunctions';

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
type NormalizedMessage = {
  role: string;
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export const normalizeMessages = (messages: Message[]): NormalizedMessage[] => {
  return messages.map(({ role, name, content, functionCall }) => {
    const obj: any = { role, content };
    if (name) obj.name = name;
    if (functionCall) obj.function_call = functionCall;
    return obj;
  });
}

export const OpenAIStream = async (
  model: OpenAIModel,
  systemPrompt: string,
  temperature: number,
  messages: Message[],
  customMessageToStreamBack?: string | null, // Stream this string at the end of the streaming
  assistantMode: boolean = false,
) => {
  let url = `${OPENAI_API_HOST}/v1/chat/completions`;
  // Ensure you have the OPENAI_API_GPT_4_KEY set in order to use the GPT-4 model
  const apiKey =
    model.id === OpenAIModelID.GPT_4
      ? process.env.OPENAI_API_GPT_4_KEY
      : process.env.OPENAI_API_KEY;

  const isGPT4Model = model.id === OpenAIModelID.GPT_4;

  const bodyToSend = {
    ...(OPENAI_API_TYPE === 'openai' && { model: model.id }),
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
    // NOTE: For now, don't call functions unless we're in assistant mode
    function_call: assistantMode ? 'auto' : 'none',
    functions: CALLABLE_FUNCTIONS,
  };
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
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
      let functionCallData: any = {};

      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data;

          if (data === '[DONE]') {
            controller.close();
            return;
          }

          try {
            const json = JSON.parse(data);
            const choice = json.choices[0];

            if (choice.delta.function_call) {
              if (choice.delta.function_call.name) {
                functionCallData = choice.delta.function_call;
              } else {
                functionCallData = {
                  ...functionCallData,
                  arguments: functionCallData.arguments + choice.delta.function_call.arguments,
                };
              }
              return;
            }

            if (choice.finish_reason === 'function_call') {
              const queue = encoder.encode(JSON.stringify({
                function_call: functionCallData
              }));
              controller.enqueue(queue);
              controller.close();
              return;
            }

            if (choice.finish_reason != null) {
              if (customMessageToStreamBack) {
                const queue = encoder.encode(customMessageToStreamBack);
                controller.enqueue(queue);
              }

              controller.close();
              return;
            }

            const text = choice.delta.content;
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
};

// Truncate log message to 4000 characters
export const truncateLogMessage = (message: string) =>
  message.length > 4000 ? `${message.slice(0, 4000)}...` : message;
