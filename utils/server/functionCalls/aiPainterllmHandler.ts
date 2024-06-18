// This is a handler to execute and return the result of a function call to LLM.
// This would seat between the endpoint and LLM.
import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';
import { AIStream } from '@/utils/server/functionCalls/AIStream';
import { triggerHelperFunction } from '@/utils/server/functionCalls/llmHandlerHelpers';

import { FunctionCall, Message } from '@/types/chat';
import { UserProfile } from '@/types/user';

type handlerType = {
  user: UserProfile;
  messages: Message[];
  countryCode: string;
  prompt: string;
  onUpdate: (payload: string) => void;
  onProgressUpdate: (payload: { content: string; type: string }) => void;
  onErrorUpdate: (payload: string) => void;
  onEnd: () => void;
};

const llmHandlerPrompt =
  DEFAULT_SYSTEM_PROMPT +
  `
Your main task is to process image generation tasks, utilizing the generate-image function.

You must follow these rules:
1. If unsure about the user input, treat it as a prompt and call the generate-image function with the input as the parameter.
2. If a user requests modifications to an existing image, locate the Generation prompt from the 'alt' attribute of the image tag. Adjust the prompt as per the user's request and rerun the generate-image function to create a new image.
3. If a user asks for the prompt used to generate a specific image, retrieve it from the 'alt' attribute of the image tag.
4. If the image generation fails, inform the user about the failure and its reason. There's no need to show the prompt to the user in this case.
5. If the 'generate-image' function was not called, provide a valid reason for not doing so.
6. If the 'generate-html-for-ai-painter-images' function is called, there's no need to display the image
  `;

export const aiPainterLlmHandler = async ({
  user,
  messages,
  countryCode,
  prompt,
  onUpdate,
  onProgressUpdate,
  onErrorUpdate,
  onEnd,
}: handlerType) => {
  const functionCallsToSend: FunctionCall[] = [];
  let isFunctionCallRequired = true;
  let innerWorkingMessages = messages;

  functionCallsToSend.push({
    name: 'generate-html-for-ai-painter-images',
    description: 'To show the result of the image generation',
    parameters: {
      type: 'object',
      properties: {
        imageResults: {
          type: 'array',
          description: 'The result of the image generation',
          items: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'The url of the image',
              },
              prompt: {
                type: 'string',
                description: 'The prompt of the image',
              },
              filename: {
                type: 'string',
                description: 'The file name of the image',
              },
            },
          },
        },
      },
    },
  });
  functionCallsToSend.push({
    name: 'generate-image',
    description: 'Generate an image from a prompt',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Prompt to generate the image. MUST BE IN ENGLISH.',
        },
      },
    },
  });

  try {
    while (isFunctionCallRequired) {
      const requestedFunctionCalls = await AIStream({
        countryCode: countryCode,
        systemPrompt: llmHandlerPrompt + prompt,
        messages: innerWorkingMessages,
        onUpdateToken: (token: string) => {
          onUpdate(token);
        },
        functionCalls: functionCallsToSend,
      });

      // No function call required, exiting
      if (requestedFunctionCalls.length === 0) {
        isFunctionCallRequired = false;
        break;
      }

      // Function call required, executing
      for (const functionCall of requestedFunctionCalls) {
        let executionResult: string;

        // Execute helper function
        if (functionCall.name === 'generate-image') {
          onProgressUpdate({
            content: 'Creating artwork...🎨',
            type: 'progress',
          });
        }
        const helperFunctionResult = await triggerHelperFunction(
          functionCall.name,
          functionCall.arguments,
          user.id,
          onProgressUpdate,
        );

        if (functionCall.name === 'generate-image') {
          onProgressUpdate({
            content: 'Ready to show you...💌',
            type: 'progress',
          });
        }
        executionResult = helperFunctionResult;

        innerWorkingMessages.push({
          role: 'function',
          name: functionCall.name,
          content: `function name '${functionCall.name}'s execution result: ${executionResult}`,
          pluginId: null,
        });
      }
    }
  } catch (err) {
    onErrorUpdate('An error occurred, please try again.');
    console.error(err);
  } finally {
    onEnd();
  }
};
