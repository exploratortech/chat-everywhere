import { Message } from '@/types/chat';
import { OpenAIModel, OpenAIModelID } from '@/types/openai';

import {
  AZURE_OPENAI_ENDPOINTS,
  AZURE_OPENAI_GPT_4_ENDPOINTS,
  AZURE_OPENAI_GPT_4_KEYS,
  AZURE_OPENAI_KEYS,
  OPENAI_API_HOST,
  OPENAI_API_TYPE,
} from '../app/const';
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
  options: {
    customMessageToStreamBack?: string | null, // Stream this string at the end of the streaming
    assistantMode?: boolean,
    prioritizeOpenAI?: boolean,
  },
) => {
  const isGPT4Model = model.id === OpenAIModelID.GPT_4;
  const [openAIEndpoints, openAIKeys] = getRandomOpenAIEndpointsAndKeys(
    {
      includeGPT4: isGPT4Model,
      includeFunctionCalling: !!options.assistantMode,
      prioritizeOpenAI: !!options.prioritizeOpenAI,
    }
  );
  
  let attempt = 0;

  while (attempt < openAIEndpoints.length) {
    const openAIEndpoint = openAIEndpoints[attempt];
    const openAIKey = openAIKeys[attempt];

    try {
      if (!openAIEndpoint || !openAIKey)
        throw new Error('Missing endpoint/key');

      const bodyToSend: any = {
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
        function_call: options.assistantMode ? 'auto' : 'none',
        functions: CALLABLE_FUNCTIONS,
      };

      const requestHeaders: { [header: string]: string } = {
        'Content-Type': 'application/json',
      };

      let resource = '';
      let modelId = model.id;

      if (openAIEndpoint.includes('openai.com')) {
        requestHeaders.Authorization = `Bearer ${openAIKey}`;
        resource = '/v1/chat/completions';

        // Fallback model
        if (attempt > 0 && !options.assistantMode) {
          modelId = OpenAIModelID.GPT_3_5;
        }

        if (options.assistantMode) {
          modelId = OpenAIModelID.GPT_3_5_16K_0613;
        }

        bodyToSend.model = modelId;
      } else {
        modelId = OpenAIModelID.GPT_3_5_AZ;;
        requestHeaders['api-key'] = openAIKey;

        if (options.assistantMode && openAIEndpoint === process.env.AZURE_OPENAI_ENDPOINT_2) {
          modelId = OpenAIModelID.GPT_3_5_16K_AZ;
        }

        resource = `/openai/deployments/${modelId}/chat/completions?api-version=2023-07-01-preview`;
      }

      const url = `${openAIEndpoint}${resource}`;

      const abortController = new AbortController();
      const timeout = setTimeout(() => abortController.abort(), 10000);

      console.log(`Sending request to ${url}`);
      
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
          console.error('OpenAIError for the endpoint:', openAIEndpoint);
          console.error(
            new OpenAIError(
              result.error.message,
              result.error.type,
              result.error.param,
              result.error.code,
              res.status,
            ),
          );
        } else {
          console.error(
            new Error(
              `OpenAI API returned an error: ${
                decoder.decode(result?.value) || result.statusText
              }`,
            ),
          );
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
          let functionCallData: any = {};
    
          const onParse = (event: ParsedEvent | ReconnectInterval) => {
            if (event.type === 'event') {
              const data = event.data;

              if (data === '[DONE]') {
                return;
              }

              try {
                const json = JSON.parse(data);
                const choice = json.choices[0];
                if (choice == null) return;

                if (choice.delta.function_call) {
                  if (choice.delta.function_call.name) {
                    functionCallData = choice.delta.function_call;
                  } else {
                    functionCallData = {
                      ...functionCallData,
                      arguments: (functionCallData.arguments || '') + choice.delta.function_call.arguments,
                    };
                  }
                  return;
                }
    
                if (choice.finish_reason === 'function_call') {
                  const jsonString = JSON.stringify({ function_call: functionCallData });
                  const queue = encoder.encode(jsonString);

                  buffer.push(queue);
                  stop = true;
                  return;
                }
    
                if (choice) {
                  if (choice.finish_reason != null) {
                    if (options.customMessageToStreamBack) {
                      buffer.push(encoder.encode(options.customMessageToStreamBack));
                    }

                    stop = true;
                    return;
                  }
                  const text = choice.delta.content;
                  buffer.push(encoder.encode(text));
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
            stop = true;
          })();
        },
      });
    } catch (error) {
      attempt += 1;
      console.error(error);
    }
  }

  throw new Error('Error: Unable to make requests to OpenAI');
};

// Truncate log message to 4000 characters
export const truncateLogMessage = (message: string) =>
  message.length > 4000 ? `${message.slice(0, 4000)}...` : message;

// Returns a list of shuffled endpoints and keys. They should be used based
// on their order in the list.
const getRandomOpenAIEndpointsAndKeys = (
  options: {
    includeGPT4?: boolean,
    includeFunctionCalling?: boolean,
    prioritizeOpenAI?: boolean,
  }
): [(string | undefined)[], (string | undefined)[]] => {
  let endpoints: (string | undefined)[] = [...AZURE_OPENAI_ENDPOINTS];
  let keys: (string | undefined)[] = [...AZURE_OPENAI_KEYS];

  for (let i = endpoints.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tempEndpoint = endpoints[i];
    const tempKey = keys[i];
    endpoints[i] = endpoints[j];
    keys[i] = keys[j];
    endpoints[j] = tempEndpoint;
    keys[j] = tempKey;
  }

  if (options.includeGPT4) {
    endpoints = [...AZURE_OPENAI_GPT_4_ENDPOINTS, ...endpoints];
    keys = [...AZURE_OPENAI_GPT_4_KEYS, ...keys];
  }

  if (options.includeFunctionCalling) {
    // Remove the endpoints that we can't use for function calls
    endpoints = endpoints.filter(
      (endpoint) => endpoint === process.env.AZURE_OPENAI_ENDPOINT_2
    );
    keys = keys.filter(
      (key) => key === process.env.AZURE_OPENAI_KEY_2
    );
  }

  if (options.prioritizeOpenAI && !options.includeFunctionCalling) {
    // Prioritize OpenAI endpoint
    endpoints.splice(0, 0, OPENAI_API_HOST);
    keys.splice(0, 0, process.env.OPENAI_API_KEY);
  } else {
    endpoints.push(OPENAI_API_HOST);
    keys.push(process.env.OPENAI_API_KEY);
  }

  return [endpoints, keys];
};
