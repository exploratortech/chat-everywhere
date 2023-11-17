import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { authorizedOpenAiRequest } from '@/utils/server';
import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';
import {
  addOpenAiMessageToThread,
  cancelCurrentThreadRun,
  updateMetadataOfMessage,
} from '@/utils/v2Chat/openAiApiUtils';

export const config = {
  runtime: 'edge',
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

const handler = async (req: Request): Promise<Response | ReadableStream> => {
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
        return await sendMessage(user.user.id, conversationId, messageContent);
      case 'create conversation':
        serverSideTrackEvent(userProfile.id, 'v2 Create conversation');
        return await createConversation(user.user.id, messageContent);
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

  const openAiResponse = await authorizedOpenAiRequest(openAiUrl, {
    method: 'GET',
  });

  if (!openAiResponse.ok) {
    console.error(await openAiResponse.text());
    return new Response('Error', { status: 500 });
  }

  const openAiData = await openAiResponse.json();
  return new Response(JSON.stringify(openAiData.data), { status: 200 });
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

  // Return a stream as a workaround to the 25 second timeout limit on edge function
  return new ReadableStream({
    async start() {
      // Cancel any hanging runs
      await cancelCurrentThreadRun(conversationId);
    
      // Add a Message object to Thread
      const messageCreationResponse = await addOpenAiMessageToThread(
        conversationId,
        {
          role: 'user',
          content: messageContent,
        },
      );
    
      const messageCreationData = await messageCreationResponse.text();
    
      if (!messageCreationResponse.ok) {
        console.error('Failed on message creation', messageCreationData);
        return new Response('Error', { status: 500 });
      }
    
      const latestMessageId = (JSON.parse(messageCreationData)).id;
    
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
      // or until 4 mins have passed
      const runId = (await runCreationResponse.json()).id;
    
      const runStatusUrl = `https://api.openai.com/v1/threads/${conversationId}/runs/${runId}`;
      let runStatusResponse;
      let runStatusData;
      const startTime = Date.now();
      const timeout = 4 * 60 * 1000;
      const interval = 500;
    
      while (Date.now() - startTime < timeout) {
        runStatusResponse = await authorizedOpenAiRequest(runStatusUrl, {
          method: 'GET',
        });
    
        if (!runStatusResponse.ok) {
          console.error(await runStatusResponse.text());
          return new Response('Error', { status: 500 });
        }
    
        runStatusData = await runStatusResponse.json();
    
        if (
          runStatusData.status === 'completed' ||
          runStatusData.status === 'requires_action'
        ) {
          break;
        }
    
        if (runStatusData.status === 'failed') {
          console.log(runStatusData);
          console.log('Run creation failed');
          return new Response('Error: Failed', { status: 500 });
        }
    
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    
      if (runStatusData.status === 'requires_action') {
        console.log('Required tool calling');
    
        await updateMetadataOfMessage(conversationId, latestMessageId, {
          imageGenerationStatus: 'in progress',
        });
    
        serverSideTrackEvent(userId, 'v2 Image generation request', {
          v2ThreadId: conversationId,
          v2MessageId: latestMessageId,
          v2runId: runStatusData.id,
        });
    
        // Trigger image generation asynchronously
        fetch(`${process.env.SERVER_HOST || `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`}/api/v2/image-generation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            threadId: conversationId,
            messageId: latestMessageId,
            runId: runStatusData.id,
          }),
        });
    
        // Some buffer room for the /image-generation serverless function to initialize
        await new Promise((resolve) => setTimeout(resolve, 1000));
    
        return new Response(null, { status: 200 });
      }
    
      if (runStatusData.status !== 'completed') {
        console.error('Timeout: Run status check exceeded 20 seconds', runStatusData);
        return new Response('Error: Timeout', { status: 500 });
      }
    },
  });
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
