// This is a simpler rewrite of the OpenAIStream function, which is the main function that handles the AI response.
// This should be used in tendon with the handler.ts file. For GPT-4 only
import { DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { shortenMessagesBaseOnTokenLimit } from '@/utils/server/api';
import { normalizeMessages } from '@/utils/server/index';

import type { FunctionCall, Message } from '@/types/chat';
import { OpenAIModelID, OpenAIModels } from '@/types/openai';

import { ChatEndpointManager } from '../ChatEndpointManager';

import type { ParsedEvent, ReconnectInterval } from 'eventsource-parser';
import { createParser } from 'eventsource-parser';

type AIStreamProps = {
  systemPrompt: string;
  messages: Message[];
  onUpdateToken: (token: string) => void;
  functionCalls: FunctionCall[];
  useOpenAI?: boolean;
  usePriorityEndpoint?: boolean;
};

type AIStreamResponseType = {
  name: string;
  arguments: string;
}[];

export const AIStream = async ({
  systemPrompt,
  messages,
  onUpdateToken,
  functionCalls,
  usePriorityEndpoint,
}: AIStreamProps): Promise<AIStreamResponseType> => {
  const model = OpenAIModels[OpenAIModelID.GPT_4O];

  const endpointManager = new ChatEndpointManager(model, usePriorityEndpoint);

  const { endpoint, key: apiKey } = endpointManager.getEndpointAndKey() || {};

  let functionCallName = '',
    functionCallArgumentInJsonString = '';

  const openAIEndpoint = endpoint || '';
  const openAIKey = apiKey || '';

  let url = `${openAIEndpoint}/openai/deployments/${model.deploymentName}/chat/completions?api-version=2024-02-01`;

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

  console.log('Sending request to: ' + url);
  res = await fetch(url, {
    headers: requestHeaders,
    method: 'POST',
    body: JSON.stringify(bodyToSend),
  });

  const decoder = new TextDecoder();

  if (res.status !== 200) {
    const errorMessage = await res.text();
    throw new Error(`Error: ${res.status} ${res.statusText} ${errorMessage}`, {
      cause: {
        message: `Error: ${res.status} ${res.statusText} ${errorMessage}`,
      },
    });
  }

  const onParse = (event: ParsedEvent | ReconnectInterval) => {
    if (event.type === 'event') {
      const data = event.data;
      if (data === '[DONE]') return;

      const json = JSON.parse(data);
      if (json.choices[0]) {
        if (json.choices[0].finish_reason != null) {
          return;
        }

        if (json.choices[0].delta?.function_call) {
          const delta = json.choices[0].delta;
          if (delta.function_call.arguments) {
            functionCallArgumentInJsonString += delta.function_call.arguments;
          }

          if (delta.function_call.name) {
            functionCallName = delta.function_call.name;
          }
        }

        const text = json.choices[0].delta?.content || '';
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
