// This is a simpler rewrite of the OpenAIStream function, which is the main function that handles the AI response.
// This should be used in tendon with the handler.ts file. For GPT-4 only
import { DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { shortenMessagesBaseOnTokenLimit } from '@/utils/server/api';
import { getEndpointsAndKeys } from '@/utils/server/api';
import { normalizeMessages } from '@/utils/server/index';

import { FunctionCall, Message } from '@/types/chat';
import { OpenAIModelID, OpenAIModels } from '@/types/openai';

import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';

type AIStreamProps = {
  countryCode: string;
  systemPrompt: string;
  messages: Message[];
  onUpdateToken: (token: string) => void;
  functionCalls: FunctionCall[];
  useOpenAI?: boolean;
};

type AIStreamResponseType = {
  name: string;
  arguments: string;
}[];

export const AIStream = async ({
  countryCode,
  systemPrompt,
  messages,
  onUpdateToken,
  functionCalls,
  useOpenAI = false,
}: AIStreamProps): Promise<AIStreamResponseType> => {
  const [openAIEndpoints, openAIKeys] = getEndpointsAndKeys(true, countryCode);

  let attempt = 0,
    stop = false,
    functionCallName = '',
    functionCallArgumentInJsonString = '';

  const openAIEndpoint = openAIEndpoints[attempt] || '';
  const openAIKey = openAIKeys[attempt] || '';
  const model = OpenAIModels[OpenAIModelID.GPT_4];

  let url = `${openAIEndpoint}/openai/deployments/${process.env.AZURE_OPENAI_GPT_4_MODEL_NAME}/chat/completions?api-version=2024-02-01`;

  const messagesToSend = await shortenMessagesBaseOnTokenLimit(
    '',
    messages,
    model.tokenLimit,
    model.completionTokenLimit,
  );

  const messagesToSendInArray = [
    {
      role: 'system',
      content: systemPrompt,
    },
    ...normalizeMessages(messagesToSend),
  ];

  const bodyToSend: any = {
    messages: messagesToSendInArray,
    max_tokens: model.completionTokenLimit,
    temperature: DEFAULT_TEMPERATURE,
    stream: true,
    presence_penalty: 0,
    frequency_penalty: 0,
  };

  if (functionCalls.length > 0) {
    bodyToSend.functions = functionCalls;
  }

  const requestHeaders: { [header: string]: string } = {
    'Content-Type': 'application/json',
  };

  requestHeaders['api-key'] = openAIKey;

  let res;
  if (useOpenAI) {
    bodyToSend.model = 'gpt-4-0125-preview';
    console.log(
      'Sending request to: https://api.openai.com/v1/chat/completions',
    );

    res = await fetch('https://api.openai.com/v1/chat/completions', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      method: 'POST',
      body: JSON.stringify(bodyToSend),
    });
  } else {
    console.log('Sending request to: ' + url);
    res = await fetch(url, {
      headers: requestHeaders,
      method: 'POST',
      body: JSON.stringify(bodyToSend),
    });
  }

  const decoder = new TextDecoder();

  if (res.status !== 200) {
    throw new Error(
      `Error: ${res.status} ${res.statusText} ${await res.text()}`,
    );
  }

  const onParse = (event: ParsedEvent | ReconnectInterval) => {
    if (event.type === 'event') {
      const data = event.data;
      if (data === '[DONE]') return;

      const json = JSON.parse(data);
      if (json.choices[0]) {
        if (json.choices[0].finish_reason != null) {
          stop = true;
          return;
        }

        if (json.choices[0].delta.function_call) {
          const delta = json.choices[0].delta;
          if (delta.function_call.arguments) {
            functionCallArgumentInJsonString += delta.function_call.arguments;
          }

          if (delta.function_call.name) {
            functionCallName = delta.function_call.name;
          }
        }

        const text = json.choices[0].delta.content || '';
        onUpdateToken(text);
      }
    }
  };

  const parser = createParser(onParse);

  for await (const chunk of res.body as any) {
    parser.feed(decoder.decode(chunk, { stream: true }));
  }

  if (functionCallName) {
    return [
      {
        name: functionCallName,
        arguments: functionCallArgumentInJsonString,
      },
    ];
  } else {
    return [];
  }
};
