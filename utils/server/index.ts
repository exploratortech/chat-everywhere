import { Message } from '@/types/chat';
import { OpenAIModel, OpenAIModelID } from '@/types/openai';

import { OPENAI_API_HOST, OPENAI_API_TYPE } from '../app/const';
import { AVAILABLE_FUNCTIONS, CALLABLE_FUNCTIONS } from '../app/callableFunctions';

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
export const normalizeMessages = (messages: Message[]): { role: string, content: string | null, name?: string, function_call?: { name: string, arguments: string }}[] => {
  return messages.map(({ role, name, content, functionCall }) => {
    const obj: any = { role, content };
    if (functionCall) obj.name = name;
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
  const normalizedMessages = normalizeMessages(messages);

  let url = `${OPENAI_API_HOST}/v1/chat/completions`;
  // Ensure you have the OPENAI_API_GPT_4_KEY set in order to use the GPT-4 model
  const apiKey =
    model.id === OpenAIModelID.GPT_4
      ? process.env.OPENAI_API_GPT_4_KEY
      : process.env.OPENAI_API_KEY;

  const isGPT4Model = model.id === OpenAIModelID.GPT_4;

  let isFinished = false;

  const stream = new ReadableStream({
    async start(controller) {

      while (!isFinished) {

        const bodyToSend = {
          ...(OPENAI_API_TYPE === 'openai' && { model: model.id }),
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            ...normalizedMessages,
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

        let functionCallName = '';
        let functionCallArgumentsBuffer = '';

        const onParse = (event: ParsedEvent | ReconnectInterval) => {
          if (event.type === 'event') {
            console.log(event);
            const data = event.data;
            // TODO: Add 'data' validation to prevent JSON.parse in the try/catch
            // block from raising an error.
            if (data === '[DONE]') return;
    
            try {
              console.log('data:', data);
              const json = JSON.parse(data);
              const choice = json.choices[0];
              console.log(choice);
    
              if (choice.delta.function_call) {
                if (choice.delta.function_call.name) {
                  functionCallName = choice.delta.function_call.name;
                } else {
                  functionCallArgumentsBuffer += choice.delta.function_call.arguments;
                }
                return;
              }
    
              if (
                choice.finish_reason === 'function_call'
                && !!functionCallName
              ) {
                console.log('functionCallArgumentsBuffer', functionCallArgumentsBuffer);

                const functionToCall = AVAILABLE_FUNCTIONS[functionCallName];
                const functionArguments = JSON.parse(functionCallArgumentsBuffer);
                const functionResponse = functionToCall(...Object.values(functionArguments));

                normalizedMessages.push({
                  role: 'assistant',
                  content: null,
                  function_call: {
                    name: functionCallName,
                    arguments: functionCallArgumentsBuffer,
                  },
                });

                normalizedMessages.push({
                  role: 'function',
                  name: functionCallName,
                  content: functionResponse,
                });
                return;
              }
    
              if (choice.finish_reason != null) {
                if (customMessageToStreamBack) {
                  const queue = encoder.encode(customMessageToStreamBack);
                  controller.enqueue(queue);
                }
    
                isFinished = true;
                controller.close();
                return;
              }
              const text = json.choices[0].delta.content;
              const queue = encoder.encode(text);
              controller.enqueue(queue);
            } catch (e) {
              isFinished = true;
              controller.error(e);
            }
          }
        };
  
        const parser = createParser(onParse);
  
        for await (const chunk of res.body as any) {
          parser.feed(decoder.decode(chunk));
        }

      }
    },
  });

  return stream;
};

// Truncate log message to 4000 characters
export const truncateLogMessage = (message: string) =>
  message.length > 4000 ? `${message.slice(0, 4000)}...` : message;
