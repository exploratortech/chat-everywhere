import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { authorizedOpenAiRequest } from '@/utils/server';
import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';
import {
  addOpenAiMessageToThread,
  cancelCurrentThreadRun,
  cancelRunOnThreadIfNeeded,
  updateMetadataOfMessage,
  waitForRunToCompletion,
} from '@/utils/v2Chat/openAiApiUtils';

import { OpenAIMessageType } from '@/types/v2Chat/chat';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1', // Only execute this function in the Korea region in case OpenAI blocks it
};

export type RequestType =
  | 'retrieve messages'
  | 'send message'
  // ^This request will trigger a "Create message" and "Create Run" requests, then
  // return 200 once the Run object is completed.
  | 'create conversation';

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const DEFAULT_MESSAGE_LIMIT = 50;
const ASSISTANT_ID = process.env.OPENAI_V2_ASSISTANT_ID;

const handler = async (req: Request): Promise<Response> => {
  const supabase = getAdminSupabaseClient();

  try {
    const userToken = req.headers.get('user-token');
    const { data: user, error: userFetchingError } =
      await supabase.auth.getUser(userToken || '');
    if (!user || userFetchingError) return unauthorizedResponse;

    const userProfile = await getUserProfile(user.user.id);
    if (!user || userProfile.plan === 'free') return unauthorizedResponse;

    const {
      conversationId,
      latestMessageId,
      beforeMessageId,
      requestType,
      messageContent,
    } = (await req.json()) as {
      requestType: RequestType;
      conversationId: string;
      beforeMessageId?: string;
      latestMessageId?: string;
      messageContent?: string;
    };

    if (!requestType)
      return new Response('Invalid request type', { status: 400 });

    switch (requestType) {
      case 'retrieve messages':
        serverSideTrackEvent(userProfile.id, 'v2 Retrieve messages');
        return await retrieveMessages(
          user.user.id,
          conversationId,
          latestMessageId,
          beforeMessageId,
        );
      case 'send message':
        serverSideTrackEvent(userProfile.id, 'v2 Send message');
        return sendMessage(user.user.id, conversationId, messageContent);
      case 'create conversation':
        serverSideTrackEvent(userProfile.id, 'v2 Create conversation');
        return createConversation(user.user.id, messageContent);
      default:
        return new Response('Invalid request type', { status: 400 });
    }
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

const doesConversationBelongToUser = async (
  userId: string,
  conversationId: string,
) => {
  const supabase = getAdminSupabaseClient();

  const { data, error } = await supabase
    .from('user_v2_conversations')
    .select('*')
    .eq('uid', userId)
    .eq('threadId', conversationId);

  if (error) {
    console.error(error);
    return false;
  }

  if (!data || data.length === 0) {
    return false;
  }

  return true;
};

const retrieveMessages = async (
  userId: string,
  conversationId: string,
  latestMessageId?: string,
  beforeMessageId?: string,
) => {
  const isConversationBelongsToUser = await doesConversationBelongToUser(
    userId,
    conversationId,
  );

  if (!isConversationBelongsToUser) {
    return new Response("Conversation doesn't exist.", { status: 404 });
  }

  let openAiUrl = `https://api.openai.com/v1/threads/${conversationId}/messages?limit=${DEFAULT_MESSAGE_LIMIT}&order=asc&`;

  if (latestMessageId) {
    openAiUrl += `after=${latestMessageId}`;
  } else if (beforeMessageId) {
    openAiUrl += `before=${beforeMessageId}`;
  }

  const messagesResponse = await authorizedOpenAiRequest(openAiUrl, {
    method: 'GET',
  });

  if (!messagesResponse.ok) {
    console.error(await messagesResponse.text());
    return new Response('Error', { status: 500 });
  }

  const messages = (await messagesResponse.json()).data as OpenAIMessageType[];
  const latestMessage = messages[messages.length - 1];

  // To handle hanging run that failed
  await cancelRunOnThreadIfNeeded(
    latestMessage.created_at,
    latestMessage.id,
    conversationId,
  );

  return new Response(JSON.stringify(messages), { status: 200 });
};

const sendMessage = async (
  userId: string,
  conversationId: string,
  messageContent?: string,
) => {
  if (!messageContent) {
    return new Response('Message content is empty', { status: 400 });
  }

  const isConversationBelongsToUser = await doesConversationBelongToUser(
    userId,
    conversationId,
  );

  if (!isConversationBelongsToUser) {
    return new Response('Unauthorized access to conversation.', {
      status: 403,
    });
  }

  await cancelCurrentThreadRun(conversationId);

  // Add a Message object to Thread
  const messageCreationResponse = await addOpenAiMessageToThread(
    conversationId,
    {
      role: 'user',
      content: messageContent,
    },
  );

  if (!messageCreationResponse.ok) {
    console.log('Failed on message creation');
    console.error(await messageCreationResponse.text());
    return new Response('Error', { status: 500 });
  }

  const latestMessageId = (await messageCreationResponse.json()).id;

  // Create a Run object for the message in Thread
  const runCreationUrl = `https://api.openai.com/v1/threads/${conversationId}/runs`;

  const runCreationResponse = await authorizedOpenAiRequest(runCreationUrl, {
    method: 'POST',
    body: JSON.stringify({
      assistant_id: ASSISTANT_ID,
    }),
  });

  if (!runCreationResponse.ok) {
    console.error(await runCreationResponse.text());
    return new Response('Error', { status: 500 });
  }

  // Keep checking every 500 ms until Run's status is completed
  // or until 15 seconds have passed
  const runId = (await runCreationResponse.json()).id;

  let runStatusData = await waitForRunToCompletion(
    conversationId,
    runId,
    true,
    15000,
  );

  if (runStatusData.status === 'requires_action') {
    console.log('Required tool calling');

    try {
      // Trigger image generation asynchronously
      fetch(
        `${
          process.env.SERVER_HOST ||
          `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        }/api/v2/image-generation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            threadId: conversationId,
            messageId: latestMessageId,
            runId: runStatusData.id,
          }),
        },
      );
      // Some buffer room for the /image-generation serverless function to initialize
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error triggering image generation:', error);
      return new Response(null, { status: 500 });
    }

    await updateMetadataOfMessage(conversationId, latestMessageId, {
      imageGenerationStatus: 'in progress',
    });

    serverSideTrackEvent(userId, 'v2 Image generation request', {
      v2ThreadId: conversationId,
      v2MessageId: latestMessageId,
      v2runId: runStatusData.id,
    });

    return new Response(null, { status: 200 });
  }

  if (runStatusData.status !== 'completed') {
    console.error('Timeout: Run status check exceeded 15 seconds');
    return new Response('Error: Timeout', { status: 500 });
  }

  return new Response(null, { status: 200 });
};

const createConversation = async (userId: string, messageContent?: string) => {
  try {
    if (!messageContent) {
      throw new Error(
        'Failed to create conversation. Missing message content.',
      );
    }

    const openAiUrl = 'https://api.openai.com/v1/threads';
    const response = await authorizedOpenAiRequest(openAiUrl, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const thread = await response.json();

    const supabase = getAdminSupabaseClient();
    const { data, error } = await supabase
      .from('user_v2_conversations')
      .insert({
        uid: userId,
        threadId: thread.id,
        title: messageContent.substring(0, 40),
      })
      .select()
      .single();

    if (!data) {
      throw new Error('');
    }

    if (error) {
      throw new Error(JSON.stringify(error));
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
