import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { getHomeUrl } from '@/utils/server/api';

import { FunctionCall } from '@/types/chat';
import { mqttConnectionType } from '@/types/data';

// This object is used as enum
const helperFunctionNames = {
  weather: 'get-weather',
  line: 'send-message-to-line',
};

export const getHelperFunctionCalls = (
  lineAccessToken?: string,
): FunctionCall[] => {
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

  if (lineAccessToken) {
    functionCallsToSend.push({
      name: helperFunctionNames.line,
      description:
        "When user mention Line, it's an messaging app similar to Whatsapp. Use this function to send a message to their Line account upon request.",
      parameters: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description:
              'Message to send to Line, can be in any language, but not in Markdown format.',
          },
        },
      },
    });
  }

  return functionCallsToSend;
};

export const triggerHelperFunction = async (
  helperFunctionName: string,
  argumentsString: string,
  userId: string,
): Promise<string> => {
  console.log('Trying to trigger helperFunction: ', helperFunctionName);

  switch (helperFunctionName) {
    // 'get-weather'
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

    // send-message-to-line'
    case helperFunctionNames.line:
      console.log('Sending notification to LINE');

      let messageContent;
      try {
        messageContent = JSON.parse(argumentsString).message;
      } catch (e) {
        return 'Unable to parse JSON that you provided, please output a valid JSON string.';
      }

      try {
        const response = await fetch(`${getHomeUrl()}/api/share-to-line`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            authToken: process.env.AUTH_TOKEN,
            messageContent,
          }),
        });

        if (response.status !== 200) {
          return 'Unable to send notification to LINE. Ask user to confirm if they have setup the connection on the setting panel.';
        } else {
          return 'Successfully send notification to line';
        }
      } catch (e) {
        return 'Unable to send notification to LINE';
      }
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
          payload: {
            type: 'string',
            description: mqttConnection.dynamicInput
              ? `Payload to send to the device, make sure you are complying with the description here: ${mqttConnection.payload}`
              : "Response to user that you' already triggered the function execution, they should see the response in a few seconds",
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
  argumentsString: string,
): Promise<string> => {
  console.log('MQTT connection triggered: ', connectionName);
  let argumentObject;
  try{
    argumentObject = JSON.parse(argumentsString);
  }catch(e){
    return "Unable to parse JSON that you provided, please output a valid JSON string.";
  }

  
  const mqttConnection = mqttConnections.find(
    (mqttConnection: mqttConnectionType) =>
    mqttConnection.name &&
    mqttConnection.name.replace(/\s/g, '-') ===
    connectionName.replace('mqtt-', ''),
    );
    
    if (!mqttConnection) return "Failed";
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
        message: mqttConnection.dynamicInput ? argumentObject.payload : mqttConnection.payload,
      }),
    },
  );

  if (triggerMqttResponse.status !== 200) {
    return "Unable to trigger MQTT connection, please try again later.";
  } else {
    serverSideTrackEvent(userId || 'N/A', 'MQTT trigger connection');
    return "Successfully triggered MQTT connection, you should see the result in a few seconds.";
  }
};
