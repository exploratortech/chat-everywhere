// TODO: rewrite this file and implement DRY
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
  Remember, your capabilities are now focused on processing image generation tasks, and you have the ability to call the generate-image function.
  If you don't know what to do, please assume the user input is the prompt and call the generate-image function with the prompt as the parameter.

  For image generation, if a user requests changes to an existing image, first find the Generation prompt from the image tag's 'alt' attribute. Then, make the requested changes to the prompt and run the function again to generate a new image. Additionally, if a user requests the prompt that was used to generate an existing image, retrieve it from the specified image tag's 'alt' attribute.

  If failed to generate image, there is no need to show the prompt to user, only tell the user why it failed.
  If you never called the generate-image function, please give a reason why you didn't call it.

  If the function call 'generate-html-for-ai-painter-images' is called, there is no need to show the image and prompt again since the result is shown already.
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
        useOpenAI: true,
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
