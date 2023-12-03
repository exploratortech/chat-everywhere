import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { OpenAIStream } from '@/utils/server';
import { getHomeUrl } from '@/utils/server/api';
import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';

import { ChatBody } from '@/types/chat';
import { type Message } from '@/types/chat';
import type { FunctionCall } from '@/types/chat';
import type { mqttConnectionType } from '@/types/data';
import { OpenAIModelID, OpenAIModels } from '@/types/openai';

const supabase = getAdminSupabaseClient();

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const handler = async (req: Request): Promise<Response> => {
  const userToken = req.headers.get('user-token');

  const { data, error } = await supabase.auth.getUser(userToken || '');
  if (!data || error) return unauthorizedResponse;

  const user = await getUserProfile(data.user.id);
  if (!user || user.plan === 'free') return unauthorizedResponse;

  const { data: mqttConnectionsData, error: mqttConnectionRequestError } =
    await supabase.from('mqtt_connections').select('*').eq('uuid', user.id);

  if (mqttConnectionRequestError || !mqttConnectionsData) {
    return new Response('Error', {
      status: 500,
      statusText: 'Failed to get MQTT connection',
    });
  }

  let promptToSend =
    DEFAULT_SYSTEM_PROMPT +
    `
    Remember. You now have the capability to control real world devices via MQTT connections via function calls.
    Each function is only responsible for one action, for example, turning on a light is one function, turning off a light is another function.
    You can trigger the function by running the function name. But only one function can be triggered at a time.
  `;

  let messageToSend: Message[] = [];
  const functionCallsToSend: FunctionCall[] = [];

  mqttConnectionsData.forEach((mqttConnection: mqttConnectionType) => {
    if (!mqttConnection.name || !mqttConnection.description) return;
    functionCallsToSend.push({
      name: mqttConnection.name.replace(/\s/g, '-'),
      description: mqttConnection.description,
      parameters: {
        type: 'object',
        properties: {
          response: {
            type: 'string',
            description:
              "Response to user that you' already triggered the function execution, they should see the response in a few seconds",
          },
        },
      },
    });
  });

  const mqttConnectionOnTrigger = async (
    connectionName: string,
  ): Promise<boolean> => {
    console.log('MQTT connection triggered: ', connectionName);

    const { data: mqttConnectionsData, error: mqttConnectionRequestError } =
      await supabase.from('mqtt_connections').select('*').eq('uuid', user.id);

    console.log('Existing MQTT connections: ', mqttConnectionsData);
    console.log('Looking for ', connectionName);

    if (mqttConnectionRequestError || !mqttConnectionsData) return false;

    const mqttConnection = mqttConnectionsData.find(
      (mqttConnection: mqttConnectionType) =>
        mqttConnection.name &&
        mqttConnection.name.replace(/\s/g, '-') === connectionName,
    );

    console.log('Found mqttConnection: ', mqttConnection);

    if (!mqttConnection) return false;

    console.log(
      'Triggering via URL: ',
      `${getHomeUrl()}/api/mqtt/send-request`,
    );

    const triggerMqttResponse = await fetch(
      `${getHomeUrl()}/api/mqtt/send-request`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-token': userToken || '',
        },
        body: JSON.stringify({
          topic: mqttConnection.topic,
          message: mqttConnection.payload,
        }),
      },
    );

    if (triggerMqttResponse.status !== 200) {
      return false;
    } else {
      serverSideTrackEvent(user.id || 'N/A', 'MQTT trigger connection');
      return true;
    }
  };

  try {
    const { messages } = (await req.json()) as ChatBody;
    messageToSend = messages;

    const stream = await OpenAIStream(
      OpenAIModels[OpenAIModelID.GPT_4],
      promptToSend,
      DEFAULT_TEMPERATURE,
      messageToSend,
      null,
      false,
      data.user.id,
      'MQTT mode message',
      functionCallsToSend,
      mqttConnectionOnTrigger,
    );

    return new Response(stream);
  } catch (error) {
    console.error(error);

    return new Response('Error', {
      status: 500,
    });
  }
};

export default handler;
