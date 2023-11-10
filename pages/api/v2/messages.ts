import { authorizedOpenAiRequest } from '@/utils/server';
import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';

export const config = {
  runtime: 'edge',
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const DEFAULT_MESSAGE_LIMIT = 20;

const handler = async (req: Request): Promise<Response> => {
  try {
    const supabase = getAdminSupabaseClient();

    const userToken = req.headers.get('user-token');
    const { data: user, error: userFetchingError } =
      await supabase.auth.getUser(userToken || '');
    if (!user || userFetchingError) return unauthorizedResponse;

    const userProfile = await getUserProfile(user.user.id);
    if (!user || userProfile.plan === 'free') return unauthorizedResponse;

    const { conversationId, latestMessageId, beforeMessageId } =
      (await req.json()) as {
        conversationId: string;
        beforeMessageId?: string;
        latestMessageId?: string;
      };

    const { data, error } = await supabase
      .from('user_v2_conversations')
      .select('*')
      .eq('uid', userProfile.id)
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
    console.log(openAiData);

    return new Response(JSON.stringify(openAiData.data), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
