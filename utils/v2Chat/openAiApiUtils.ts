import { MessageMetaDataType, OpenAiImageResponseType } from '@/types/v2Chat/chat';
import {
  MessageType,
  OpenAIMessageType,
  OpenAIRunType,
} from '@/types/v2Chat/chat';

export const addOpenAiMessageToThread = async (
  threadId: string,
  message: MessageType,
): Promise<Response> => {
  const openAiUrl = `https://api.openai.com/v1/threads/${threadId}/messages`;

  const response = await authorizedOpenAiRequest(openAiUrl, {
    method: 'POST',
    body: JSON.stringify(message),
  });

  return response;
};

export const updateMetadataOfMessage = async (
  threadId: string,
  messageId: string,
  metadata: MessageMetaDataType,
) => {
  const openAiUrl = `https://api.openai.com/v1/threads/${threadId}/messages/${messageId}`;

  const response = await authorizedOpenAiRequest(openAiUrl, {
    method: 'POST',
    body: JSON.stringify({
      metadata,
    }),
  });

  if (!response.ok) {
    console.error(await response.text());
    throw new Error('Failed to update message metadata');
  }
};

export const getOpenAiMessage = async (
  threadId: string,
  messageId: string,
): Promise<OpenAIMessageType> => {
  const openAiUrl = `https://api.openai.com/v1/threads/${threadId}/messages/${messageId}`;

  const response = await authorizedOpenAiRequest(openAiUrl);

  if (!response.ok) {
    console.error(await response.text());
    throw new Error('Failed to retrieve message');
  }

  const message: OpenAIMessageType = await response.json();
  return message;
};

export const getOpenAiRunObject = async (
  threadId: string,
  runId: string,
): Promise<OpenAIRunType> => {
  const openAiUrl = `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`;

  const response = await authorizedOpenAiRequest(openAiUrl);

  if (!response.ok) {
    console.error(await response.text());
    throw new Error('Failed to retrieve run');
  }

  const run: OpenAIRunType = await response.json();
  return run;
};

export const generateImage = async (
  prompt: string,
): Promise<OpenAiImageResponseType> => {
  const openAiUrl = 'https://api.openai.com/v1/images/generations';

  const payload = {
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1024x1024',
    response_format: 'url',
  };

  let response;
  let delay = 500; // Initial delay of 500ms
  let retries = 0; // Initial retry count
  const maxRetries = 10;

  while (retries < maxRetries) {
    response = await authorizedOpenAiRequest(openAiUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (response.status !== 429) {
      break;
    }

    // If status is 429 (Too Many Requests), wait for the delay then double it for the next iteration
    await new Promise(resolve => setTimeout(resolve, delay));
    delay *= 2;
    retries += 1;
  }

  if (!response || !response.ok || retries === maxRetries) {
    if(response){
      console.error(await response.text());
    }
    throw new Error('Failed to generate image');
  }

  const imageResponse: OpenAiImageResponseType = await response.json();
  return imageResponse;
};

export const waitForRunToCompletion = async (
  threadId: string,
  runId: string,
) => {
  let run: OpenAIRunType;
  let startTime = Date.now();
  do {
    run = await getOpenAiRunObject(threadId, runId);
    if (run.status === 'completed' || run.status === 'failed') {
      break;
    }
    if (Date.now() - startTime > 5000) {
      throw new Error('Timeout after 5 seconds');
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  } while (true);
};

export const submitToolOutput = async (
  threadId: string,
  runId: string,
  toolCallId: string,
  toolCallOutput: string,
) => {
  const openAiUrl = `https://api.openai.com/v1/threads/${threadId}/runs/${runId}/submit_tool_outputs`;

  const response = await authorizedOpenAiRequest(openAiUrl, {
    method: 'POST',
    body: JSON.stringify({
      tool_outputs: [
        {
          tool_call_id: toolCallId,
          output: toolCallOutput,
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error(await response.text());
    throw new Error('Failed to submit tool outputs');
  }
};

// Move this function from utils/server/index.ts to here for serverless function compatibility reason
const authorizedOpenAiRequest = async (
  url: string,
  options: RequestInit = {},
) => {
  const headers = {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    'OpenAI-Beta': 'assistants=v1',
    'Content-Type': 'application/json',
    ...options.headers,
  };
  return fetch(url, { ...options, headers });
};
