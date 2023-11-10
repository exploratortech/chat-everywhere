import { authorizedOpenAiRequest } from '@/utils/server';
import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';

export const config = {
  runtime: 'edge',
};

export type requestType =
  | 'retrieve messages'
  | 'send message'
  // ^This request will trigger a "Create message" and "Create Run" requests, then
  // return 200 once the Run object is completed.
  | 'create conversation';

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const DEFAULT_MESSAGE_LIMIT = 20;

const handler = async (req: Request): Promise<Response> => {
  const supabase = getAdminSupabaseClient();

  try {
    const userToken = req.headers.get('user-token');
    const { data: user, error: userFetchingError } =
      await supabase.auth.getUser(userToken || '');
    if (!user || userFetchingError) return unauthorizedResponse;

    const userProfile = await getUserProfile(user.user.id);
    if (!user || userProfile.plan === 'free') return unauthorizedResponse;

    const { conversationId, latestMessageId, beforeMessageId, requestType } =
      (await req.json()) as {
        requestType: requestType;
        conversationId: string;
        beforeMessageId?: string;
        latestMessageId?: string;
      };

    if (!requestType)
      return new Response('Invalid request type', { status: 400 });

    switch (requestType) {
      case 'retrieve messages':
        return await retrieveMessages(
          user.user.id,
          conversationId,
          latestMessageId,
          beforeMessageId,
        );
      // case 'send message':
      //   return sendMessage(user.user.id, conversationId);
      // case 'create conversation':
      //   return createConversation(user.user.id);
      default:
        return new Response('Invalid request type', { status: 400 });
    }
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

const retrieveMessages = async (
  userId: string,
  conversationId: string,
  latestMessageId?: string,
  beforeMessageId?: string,
) => {
  const supabase = getAdminSupabaseClient();

  const { data, error } = await supabase
    .from('user_v2_conversations')
    .select('*')
    .eq('uid', userId)
    .eq('threadId', conversationId);

  if (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }

  if (!data || data.length === 0) {
    return new Response("Conversation doesn't exist.", { status: 404 });
  }

  let openAiUrl = `https://api.openai.com/v1/threads/${conversationId}/messages?limit=${DEFAULT_MESSAGE_LIMIT}&`;

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

export default handler;
