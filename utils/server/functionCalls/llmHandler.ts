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
  Remember. You now have the capability to control real world devices via MQTT connections via function calls (the function name starts with 'mqtt'). 
  Also you can retrieve real world data via function calls (the function name starts with 'mqttreceiver-').

  But only limited to the functions that we provided.
  Each function is only responsible for one action, for example, turning on a light is one function, turning off a light is another function.

  If user request to execute multiple functions at the same time, run them one by one. 
  For example, if user request to turn on a light and turn off a light at the same time, run the turn on function first, then run the turn off function.

  If user request to make changes to an image, first find the Generation prompt from the image tag's 'alt' attribute, then make changes to the prompt and run the function again.
  Also get the prompt that used to generate the image from the specified image tag's 'alt' attribute, if user requested for it.
  `;

export const llmHandler = async ({
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

  const { data: mqttConnectionsData, error: mqttConnectionRequestError } =
    await supabase.from('mqtt_connections').select('*').eq('uuid', user.id);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('line_access_token')
    .match({ id: user.id })
    .single();

  if (mqttConnectionRequestError || !mqttConnectionsData || profileError) {
    onUpdate('[Error]');
    console.error(mqttConnectionRequestError);
    onEnd();
    return;
  }

  const processedMqttConnections = mqttConnectionsData.map(
    (mqttConnection) => ({
      ...mqttConnection,
      dynamicInput: mqttConnection.dynamic_input,
    }),
  );

  functionCallsToSend.push(
    ...getFunctionCallsFromMqttConnections(processedMqttConnections),
    ...getReceiverFunctionCallsFromMqttConnections(processedMqttConnections),
    ...getHelperFunctionCalls(profile.line_access_token),
  );

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

      // No function call required, exiting
      if (requestedFunctionCalls.length === 0) {
        isFunctionCallRequired = false;
        break;
      }

      // Function call required, executing
      for (const functionCall of requestedFunctionCalls) {
        let executionResult: string;

        if (functionCall.name.startsWith('mqtt-')) {
          // Send payload to MQTT connection
          onUpdate(`*[Executing] ${functionCall.name}*\n`);
          const mqttConnectionResult = await triggerMqttConnection(
            user.id,
            processedMqttConnections,
            functionCall.name,
            functionCall.arguments,
          );
          onUpdate(`*[Finish executing] ${functionCall.name}*\n`);
          executionResult = mqttConnectionResult;
        } else if (functionCall.name.startsWith('mqttreceiver-')) {
          // Retrieve payload from MQTT connection
          onUpdate(`*[Executing] ${functionCall.name}*\n`);
          const mqttConnectionResult = await retrieveMqttConnectionPayload(
            user.id,
            processedMqttConnections,
            functionCall.name,
          );
          onUpdate(`*[Finish executing] ${functionCall.name}*\n`);
          executionResult = mqttConnectionResult;
        } else {
          // Execute helper function
          onUpdate(`*[Executing] ${functionCall.name}*\n`);
          const helperFunctionResult = await triggerHelperFunction(
            functionCall.name,
            functionCall.arguments,
            user.id,
          );
          onUpdate(`*[Finish executing] ${functionCall.name}*\n`);
          executionResult = helperFunctionResult;
        }

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
