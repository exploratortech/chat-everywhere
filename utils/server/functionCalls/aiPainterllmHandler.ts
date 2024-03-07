// TODO: rewrite this file and implement DRY
// This is a handler to execute and return the result of a function call to LLM.
// This would seat between the endpoint and LLM.
import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';
import { AIStream } from '@/utils/server/functionCalls/AIStream';
import {
  getFunctionCallsFromMqttConnections,
  getHelperFunctionCalls,
  getReceiverFunctionCallsFromMqttConnections,
  retrieveMqttConnectionPayload,
  triggerHelperFunction,
  triggerMqttConnection,
} from '@/utils/server/functionCalls/llmHandlerHelpers';
import { getAdminSupabaseClient } from '@/utils/server/supabase';

import { FunctionCall, Message } from '@/types/chat';
import { UserProfile } from '@/types/user';

type handlerType = {
  user: UserProfile;
  messages: Message[];
  countryCode: string;
  onUpdate: (payload: string) => void;
  onEnd: () => void;
};

const llmHandlerPrompt =
  DEFAULT_SYSTEM_PROMPT +
  `
  Remember, your capabilities are now focused on processing general-purpose chat and image generation tasks. 

  For image generation, if a user requests changes to an existing image, first find the Generation prompt from the image tag's 'alt' attribute. Then, make the requested changes to the prompt and run the function again to generate a new image. Additionally, if a user requests the prompt that was used to generate an existing image, retrieve it from the specified image tag's 'alt' attribute.
  `;

export const aiPainterLlmHandler = async ({
  user,
  messages,
  countryCode,
  onUpdate,
  onEnd,
}: handlerType) => {
  const supabase = getAdminSupabaseClient();
  const functionCallsToSend: FunctionCall[] = [];
  let isFunctionCallRequired = true;
  let innerWorkingMessages = messages;

  functionCallsToSend.push(...getAllFunctionCalls());

  try {
    while (isFunctionCallRequired) {
      const requestedFunctionCalls = await AIStream({
        countryCode: countryCode,
        systemPrompt: llmHandlerPrompt,
        messages: innerWorkingMessages,
        onUpdateToken: (token: string) => {
          onUpdate(token);
        },
        functionCalls: functionCallsToSend,
      });

      console.log({
        requestedFunctionCalls,
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
        onUpdate(`*[Executing] ${functionCall.name}*\n`);
        const helperFunctionResult = await triggerHelperFunction(
          functionCall.name,
          functionCall.arguments,
          user.id,
        );
        onUpdate(`*[Finish executing] ${functionCall.name}*\n`);
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
    onUpdate('*[ERROR]*');
    console.error(err);
  } finally {
    onEnd();
  }
};

export const getAllFunctionCalls = (): FunctionCall[] => {
  const functionCallsToSend: FunctionCall[] = [];

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

  return functionCallsToSend;
};
