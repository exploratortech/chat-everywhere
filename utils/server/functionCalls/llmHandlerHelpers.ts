import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { getHomeUrl } from '@/utils/server/api';

import { FunctionCall } from '@/types/chat';
import { mqttConnectionType } from '@/types/data';

const helperFunctionNames = { weather: 'get-weather' };

export const getHelperFunctionCalls = (): FunctionCall[] => {
  const functionCallsToSend: FunctionCall[] = [];

  functionCallsToSend.push({
    name: helperFunctionNames.weather,
    description: 'Get weather information',
    parameters: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description:
            "City of the weather you want to get, for example, 'Taipei'. Translate the city name to English before sending it to this function.",
        },
      },
    },
  });

  return functionCallsToSend;
};

export const triggerHelperFunction = async (
  helperFunctionName: string,
  argumentsString: string,
): Promise<string> => {
  switch (helperFunctionName) {
    case helperFunctionNames.weather:
      let cityName: string;
      const apiKey = process.env.WEATHER_API_KEY;
      try {
        cityName = JSON.parse(argumentsString).city;
      } catch (e) {
        return 'Unable to parse JSON that you provided, please output a valid JSON string. For example, {"city": "Taipei"}';
      }

      serverSideTrackEvent('N/A', 'Helper function triggered', {
        helperFunctionName: helperFunctionNames.weather,
      });

      const triggerGetWeatherResponse = await fetch(
        `https://api.weatherapi.com/v1/current.json?q=${cityName}&key=${apiKey}`,
      );

      if (triggerGetWeatherResponse.status !== 200) {
        return (
          'Unable to get weather information, below is the error message: \n' +
          (await triggerGetWeatherResponse.text())
        );
      }

      return (
        'Here is the weather information: \n' +
        JSON.stringify(await triggerGetWeatherResponse.json(), null, 2)
      );
    default:
      return "I don't know how to do that yet, please try again later.";
  }
};

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
