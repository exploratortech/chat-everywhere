import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { getHomeUrl } from '@/utils/server/api';

import { FunctionCall } from '@/types/chat';
import { mqttConnectionType } from '@/types/data';

export const getFunctionCallsFromMqttConnections = (
  mqttConnectionsData: mqttConnectionType[],
): FunctionCall[] => {
  const functionCallsToSend: FunctionCall[] = [];

  mqttConnectionsData.forEach((mqttConnection: mqttConnectionType) => {
    if (!mqttConnection.name || !mqttConnection.description) return;
    functionCallsToSend.push({
      name: `mqtt-${mqttConnection.name.replace(/\s/g, '-')}`,
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

  return functionCallsToSend;
};

export const triggerMqttConnection = async (
  userId: string,
  mqttConnections: mqttConnectionType[],
  connectionName: string,
): Promise<boolean> => {
  console.log('MQTT connection triggered: ', connectionName);

  const mqttConnection = mqttConnections.find(
    (mqttConnection: mqttConnectionType) =>
      mqttConnection.name &&
      mqttConnection.name.replace(/\s/g, '-') ===
        connectionName.replace('mqtt-', ''),
  );

  if (!mqttConnection) return false;
  
  const triggerMqttResponse = await fetch(
    `${getHomeUrl()}/api/mqtt/send-request`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': process.env.AUTH_TOKEN || '',
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
    serverSideTrackEvent(userId || 'N/A', 'MQTT trigger connection');
    return true;
  }
};
