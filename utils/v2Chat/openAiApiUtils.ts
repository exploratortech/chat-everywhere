import { getAdminSupabaseClient } from '@/utils/server/supabase';

import type {
  MessageMetaDataType,
  MessageType,
  OpenAIMessageType,
  OpenAIRunType,
  OpenAiImageResponseType,
} from '@/types/v2Chat/chat';
import { activeRunStatuses } from '@/types/v2Chat/chat';

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

export const getMessagesByThreadId = async (
  threadId: string,
  limit: number = 10,
): Promise<OpenAIMessageType[]> => {
  const openAiUrl = `https://api.openai.com/v1/threads/${threadId}/messages?limit=${limit}`;

  const response = await authorizedOpenAiRequest(openAiUrl);

  if (!response.ok) {
    console.error(await response.text());
    throw new Error('Failed to retrieve messages');
  }

  const messages: OpenAIMessageType[] = (await response.json()).data;
  return messages;
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

export const getOpenAiLatestRunObject = async (
  threadId: string,
): Promise<OpenAIRunType> => {
  const openAiUrl = `https://api.openai.com/v1/threads/${threadId}/runs?limit=1`;

  const response = await authorizedOpenAiRequest(openAiUrl);

  if (!response.ok) {
    console.error(await response.text());
    throw new Error('Failed to retrieve latest run');
  }

  const runs: OpenAIRunType[] = (await response.json()).data;
  return runs[0];
};

export const generateImage = async (
  prompt: string,
): Promise<OpenAiImageResponseType & { errorMessage?: string }> => {
  const openAiUrl = 'https://api.openai.com/v1/images/generations';

  const payload = {
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1024x1024',
    response_format: 'b64_json',
  };

  let response;
  let delay = 500; // Initial delay of 500ms
  let retries = 0; // Initial retry count
  const maxRetries = 5;

  while (retries < maxRetries) {
    // TODO: We need to fix this after Azure opted-out the content-filter
    // if (retries < 4) {
    //   response = await authorizedDalle3AzureRequest({
    //     method: 'POST',
    //     body: JSON.stringify(payload),
    //   });
    // } else {
    response = await authorizedOpenAiRequest(openAiUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    // }

    if (response.status !== 429 && response.status !== 404) {
      break;
    }

    // If status is 429 (Too Many Requests), wait for the delay then double it for the next iteration
    await new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
    delay *= 2;
    retries += 1;
  }

  if (!response) {
    console.log('Failed to generate image, empty response.');
    throw new Error('Failed to generate image, empty response.');
  }

  const imageResponse: OpenAiImageResponseType = await response.json();
  const imageGenerationResponse: OpenAiImageResponseType & {
    errorMessage?: string;
  } = imageResponse;

  if (!response.ok) {
    console.log(imageResponse?.error?.message);
    imageGenerationResponse.errorMessage = imageResponse?.error?.message;
  } else if (retries === maxRetries) {
    console.log('Failed to generate image, max retries reached');
    imageGenerationResponse.errorMessage =
      'Server is busy, please try again later.';
  }
  return imageGenerationResponse;
};

export const cancelCurrentThreadRun = async (threadId: string) => {
  const openAiUrl = `https://api.openai.com/v1/threads/${threadId}/runs?limit=10`;
  const response = await authorizedOpenAiRequest(openAiUrl, {
    method: 'GET',
  });

  if (!response.ok) {
    // Failed gracefully since there maybe a race condition
    console.error('Failed to retrieve runs');
    return;
  }

  const runs: OpenAIRunType[] = (await response.json()).data;
  const activeRuns = runs.filter((run) =>
    activeRunStatuses.includes(run.status),
  );

  for (const activeRun of activeRuns) {
    console.log(
      'Canceling run: ',
      activeRun.id,
      ' with status: ',
      activeRun.status,
    );

    const cancelUrl = `https://api.openai.com/v1/threads/${threadId}/runs/${activeRun.id}/cancel`;
    let cancelResponse = await authorizedOpenAiRequest(cancelUrl, {
      method: 'POST',
    });

    if (!cancelResponse.ok) {
      console.error('Failed to cancel run: ', activeRun.id);
      throw new Error('Failed to cancel run');
    }

    // Wait until the run no longer has the in_progress, requires_action, or cancelling status
    let runStatus = activeRun.status;
    let startTime = Date.now();
    while (activeRunStatuses.includes(runStatus)) {
      const runObject = await getOpenAiRunObject(threadId, activeRun.id);
      runStatus = runObject.status;
      if (Date.now() - startTime > 5000) {
        console.error('Timeout after 5 seconds');
        throw new Error('Timeout after 5 seconds');
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  const supabase = getAdminSupabaseClient();
  await supabase
    .from('user_v2_conversations')
    .update({ runInProgress: false })
    .eq('threadId', threadId);
};

export const waitForRunToComplete = async (
  threadId: string,
  runId: string,
  acceptRequiresActionStatus = false,
  timeoutLimit = 5000,
): Promise<OpenAIRunType> => {
  let run: OpenAIRunType;
  let startTime = Date.now();
  do {
    run = await getOpenAiRunObject(threadId, runId);
    if (
      run.status === 'completed' ||
      run.status === 'failed' ||
      run.status === 'expired'
    ) {
      break;
    }
    if (acceptRequiresActionStatus && run.status === 'requires_action') {
      break;
    }
    if (Date.now() - startTime > timeoutLimit) {
      throw new Error(
        `Timeout after ${
          timeoutLimit / 1000
        } seconds while waiting for run to complete. Run status: ${run.status}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  } while (true);

  return run;
};

// This is a health check function intended to be called by the client periodically
export const cancelRunOnThreadIfNeeded = async (threadId: string) => {
  const supabase = getAdminSupabaseClient();

  const fiveMinsInSeconds = 5 * 60;
  const currentTimestampInSeconds = Date.now() / 1000;

  const { data: conversationData } = await supabase
    .from('user_v2_conversations')
    .select('*')
    .eq('threadId', threadId)
    .single();

  const latestMessages = await getMessagesByThreadId(threadId, 2);

  if (latestMessages.length === 0 || !conversationData) {
    return;
  }

  if (!conversationData.runInProgress) return;

  const latestMessage = latestMessages[0];

  if (
    currentTimestampInSeconds - latestMessage.created_at <
    fiveMinsInSeconds
  ) {
    return;
  } else {
    console.log('Message is more than 5 mins old, cancelling run');
    await updateMetadataOfMessage(threadId, latestMessage.id, {
      imageGenerationStatus: 'failed',
    });
    await cancelCurrentThreadRun(threadId);
  }
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
  console.log('hitting openai endpoint: ', url);
  return fetch(url, { ...options, headers });
};
