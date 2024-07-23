import { Logger } from 'next-axiom';

import type { FunctionCall } from '@/types/chat';
import { OpenAIModelID, OpenAIModels } from '@/types/openai';

import { ERROR_MESSAGES } from '../app/const';
import { ChatEndpointManager } from './ChatEndpointManager';

const translateSystemPrompt = `
ROLES: You are a AI prompt-generate bot, your job is to translate and enhance the prompt to English and call 'generate-image' function, follow user's instruction as strictly as possible.
1. First determine the prompt's language:
  If the prompt is not in English:
    1. Translate the prompt to English, keeping in mind the context for simplicity
    2. Embellish the translated prompt with additional details for enhanced visual appeal
    3. Make sure your response is solely in English

  if the prompt is in english:
    1. Simply echo the original prompt verbatim
    2. Refrain from making any alterations to the original prompt

2. Afterward, called the available function based on the following condition:
  if the prompt is ready to be processed:
    - call the 'generate-image' function with the prompt.
  if there are anything wrong or the prompt is not ready for processing:
    - call the 'error-message' function indicating the errorMessage

IMPORTANT TO NOTE: you must only called the function with the name 'generate-image' or 'error-message', there is no explanation needed.
`;

const temperature = 0.1;

const functionCallsToSend: FunctionCall[] = [
  {
    name: 'error-message',
    description: 'error message',
    parameters: {
      type: 'object',
      properties: {
        errorMessage: {
          type: 'string',
          description: 'error message',
        },
      },
    },
  },
  {
    name: 'generate-image',
    description: 'generate an image from a prompt',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'prompt to generate the image. must be in english.',
        },
      },
    },
  },
];

async function callGptAPI(
  prompt: string,
  usePriorityEndpoint: boolean = false,
) {
  const log = new Logger();

  const model = OpenAIModels[OpenAIModelID.GPT_4O];
  const endpointManager = new ChatEndpointManager(model, usePriorityEndpoint);

  let attempt = 0;
  let attemptLogs = '';
  const messagesToSendInArray = [
    {
      role: 'system',
      content: translateSystemPrompt,
    },
    {
      role: 'user',
      content: `Prompt: ${prompt}`,
    },
  ];

  while (endpointManager.getAvailableEndpoints().length !== 0) {
    console.log(
      'endpointManager.getAvailableEndpoints().length',
      endpointManager.getAvailableEndpoints().length,
    );
    const { endpoint, key: apiKey } = endpointManager.getEndpointAndKey() || {};

    if (!endpoint || !apiKey) {
      throw new Error('No available endpoints');
    }

    try {
      const { url, options } = endpointManager.getFetchOptions({
        messagesToSendInArray,
        temperature,
        functionCallsToSend,
        stream: false,
      });

      console.log(`Sending request to ${url}`);
      attemptLogs += `Attempt ${attempt + 1}: Sending request to ${url}\n`;

      const res = await fetch(url, {
        ...options,
      });
      console.log('res.status', res.status);

      if (endpointManager.getRetryStatusCodes().includes(res.status)) {
        endpointManager.markEndpointAsThrottled(endpoint);
        attempt += 1;
        continue;
      } else if (res.status !== 200) {
        const response = await res.json();
        if (response.error.code === 'content_filter') {
          throw new Error(ERROR_MESSAGES.content_filter_triggered.message);
        }
        if (response.error) {
          console.error(response.error);

          log.error('OpenAIStream error', {
            message: response.error,
          });

          attemptLogs += `Attempt ${attempt + 1}: Error - ${
            response.error.message
          }\n`;
        }
        throw new Error(`Unhandled error ${response.error} ${res.status}`);
      } else {
        const response = await res.json();
        console.log('responseJSON', response);
        return response;
      }
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
    }
  }
  throw new Error(
    'Failed to translate and enhance prompt: No endpoint available',
  );
}

export const translateAndEnhancePrompt = async (
  prompt: string,
  usePriorityEndpoint: boolean = false,
) => {
  try {
    let functionCallResponse;
    const maxRetries = 3;

    // Try until the response is a function call
    for (let i = 0; i < maxRetries; i++) {
      console.log(`Retrying... ${i + 1}/${maxRetries}`);
      const retryResponseJson = await callGptAPI(prompt, usePriorityEndpoint);

      // Block by content filter
      if (
        retryResponseJson.error &&
        retryResponseJson.error.code === 'content_filter'
      ) {
        throw new Error('Translate and enhance prompt error', {
          cause: {
            code: retryResponseJson.error.code,
            message:
              'Sorry, our safety system detected unsafe content in your message. Please try again with a different topic.',
          },
        });
      }
      functionCallResponse = retryResponseJson.choices[0].message.function_call;

      if (functionCallResponse) {
        break;
      }
    }

    if (!functionCallResponse) {
      throw new Error('Translate and enhance prompt error', {
        cause: {
          message: 'Failed to enhance the prompt after multiple attempts',
        },
      });
    }

    const functionName = functionCallResponse.name;
    const functionParameters = JSON.parse(functionCallResponse.arguments);

    if (functionName === 'error-message') {
      throw new Error('Translate and enhance prompt error', {
        cause: {
          message: functionParameters.errorMessage,
        },
      });
    } else if (functionName === 'generate-image') {
      console.log('resultPrompt', functionParameters.prompt);
      return functionParameters.prompt as string;
    }
  } catch (error) {
    throw error;
  }
};
