// This is a handler to execute and return the result of a function call to LLM.
// This would seat between the endpoint and LLM.
import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';
import { AIStream } from '@/utils/server/functionCalls/AIStream';
import {
  getFunctionCallsFromMqttConnections,
  triggerMqttConnection,
  getHelperFunctionCalls,
  triggerHelperFunction,
} from '@/utils/server/functionCalls/llmHandlerHelpers';
import { getAdminSupabaseClient } from '@/utils/server/supabase';

import { FunctionCall, Message } from '@/types/chat';
import { UserProfile } from '@/types/user';

type handlerType = {
  user: UserProfile;
  messages: Message[];
  onUpdate: (payload: string) => void;
  onEnd: () => void;
};

const llmHandlerPrompt =
  DEFAULT_SYSTEM_PROMPT +
  `
Remember. You now have the capability to control real world devices via MQTT connections via function calls.
Each function is only responsible for one action, for example, turning on a light is one function, turning off a light is another function.

If user request to execute multiple functions at the same time, run them one by one. 
For example, if user request to turn on a light and turn off a light at the same time, run the turn on function first, then run the turn off function.
`;

export const llmHandler = async ({
  user,
  messages,
  onUpdate,
  onEnd,
}: handlerType) => {
  const supabase = getAdminSupabaseClient();
  const functionCallsToSend: FunctionCall[] = [];
  let isFunctionCallRequired = true;
  let innerWorkingMessages = messages;

  const { data: mqttConnectionsData, error: mqttConnectionRequestError } =
    await supabase.from('mqtt_connections').select('*').eq('uuid', user.id);

  if (mqttConnectionRequestError || !mqttConnectionsData) {
    onUpdate('[Error]');
    console.error(mqttConnectionRequestError);
    onEnd();
    return;
  }

  functionCallsToSend.push(
    ...getFunctionCallsFromMqttConnections(mqttConnectionsData),
    ...getHelperFunctionCalls(),
  );

  try {
    while (isFunctionCallRequired) {
      const requestedFunctionCalls = await AIStream({
        systemPrompt: llmHandlerPrompt,
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
        if (functionCall.name.startsWith('mqtt-')) {
          onUpdate(`*[Executing] ${functionCall.name}*\n`);
          const mqttConnectionResult = await triggerMqttConnection(
            user.id,
            mqttConnectionsData,
            functionCall.name,
          );
          onUpdate(`*[Finish executing] ${functionCall.name}*\n`);
          innerWorkingMessages.push({
            role: 'function',
            name: functionCall.name,
            content: `function name '${functionCall.name}' execution result: ${
              mqttConnectionResult ? 'success' : 'failed'
            }`,
            pluginId: null,
          });
        }else{
          onUpdate(`*[Executing] ${functionCall.name}*\n`);
          const helperFunctionResult = await triggerHelperFunction(
            functionCall.name,
            functionCall.arguments,
          );
          onUpdate(`*[Finish executing] ${functionCall.name}*\n`);

          innerWorkingMessages.push({
            role: 'function',
            name: functionCall.name,
            content: `function name '${functionCall.name}'s execution result: ${
              helperFunctionResult
            }`,
            pluginId: null,
          });
        }
      }
    }
  } catch (err) {
    onUpdate('[ERROR]');
    console.error(err);
  } finally {
    onEnd();
  }
};
