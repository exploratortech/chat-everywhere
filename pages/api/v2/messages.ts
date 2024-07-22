import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { authorizedOpenAiRequest } from '@/utils/server/api';
import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';
import {
  addOpenAiMessageToThread,
  cancelRunOnThreadIfNeeded,
} from '@/utils/v2Chat/openAiApiUtils';

import type { OpenAIMessageType } from '@/types/v2Chat/chat';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1', // Only execute this function in the Korea region in case OpenAI blocks it
  regions: [
    'arn1',
    'bom1',
    'cdg1',
    'cle1',
    'cpt1',
    'dub1',
    'fra1',
    'gru1',
    'hnd1',
    'iad1',
    'icn1',
    'kix1',
    'lhr1',
    'pdx1',
    'sfo1',
    'sin1',
    'syd1',
  ],
};

export type RequestType =
  | 'retrieve messages'
  | 'send message'
  // ^This request will trigger a "Create message" and "Create Run" requests, then
  // return 200 once the Run object is completed.
  | 'create conversation';

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const DEFAULT_MESSAGE_LIMIT = 30;
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

    const { conversationId, latestMessageId, requestType, messageContent } =
      (await req.json()) as {
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
) => {
  const supabase = getAdminSupabaseClient();

  const isConversationBelongsToUser = await doesConversationBelongToUser(
    userId,
    conversationId,
  );

  if (!isConversationBelongsToUser) {
    return new Response("Conversation doesn't exist.", { status: 404 });
  }

  let openAiUrl = `https://api.openai.com/v1/threads/${conversationId}/messages?limit=${DEFAULT_MESSAGE_LIMIT}&order=desc&`;

  if (latestMessageId) {
    openAiUrl += `after=${latestMessageId}`;
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

  if (!latestMessage) {
    return new Response(
      JSON.stringify({
        messages: [],
        requiresPolling: false,
      }),
      { status: 200 },
    );
  }

  const { data: conversationObject } = await supabase
    .from('user_v2_conversations')
    .select('id, uid, threadId, title, runInProgress, processLock')
    .eq('threadId', conversationId)
    .single();

  return new Response(
    JSON.stringify({
      messages,
      requiresPolling: conversationObject?.runInProgress || false,
    }),
    { status: 200 },
  );
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

  await cancelRunOnThreadIfNeeded(conversationId);

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

  await setConversationRunInProgress(conversationId, true);

  fetch(
    `${
      process.env.SERVER_HOST || `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    }/api/v2/thread-handler`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': process.env.THREAD_RUNNER_AUTH_TOKEN || '',
      },
      body: JSON.stringify({
        threadId: conversationId,
        runId: (await runCreationResponse.json()).id,
        messageId: (await messageCreationResponse.json()).id,
      }),
    },
  );

  await new Promise((resolve) => setTimeout(resolve, 200));

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

const setConversationRunInProgress = async (
  conversationId: string,
  runInProgress: boolean,
) => {
  const supabase = getAdminSupabaseClient();
  await supabase
    .from('user_v2_conversations')
    .update({
      runInProgress,
    })
    .eq('threadId', conversationId);
};

export default handler;
