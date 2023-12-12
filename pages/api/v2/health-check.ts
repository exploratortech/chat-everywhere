import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';
import { cancelRunOnThreadIfNeeded } from '@/utils/v2Chat/openAiApiUtils';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const handler = async (req: Request): Promise<Response> => {
  const supabase = getAdminSupabaseClient();

  try {
    const userToken = req.headers.get('user-token');
    const { data: user, error: userFetchingError } =
      await supabase.auth.getUser(userToken || '');
    if (!user || userFetchingError) return unauthorizedResponse;

    const userProfile = await getUserProfile(user.user.id);
    if (!user || userProfile.plan === 'free') return unauthorizedResponse;

    const { threadId } = (await req.json()) as {
      threadId: string;
    };

    const { data: threadData } = await supabase
      .from('user_v2_conversations')
      .select('*')
      .eq('threadId', threadId)
      .eq('uid', userProfile.id)
      .single();

    if (!threadData) {
      return new Response('Thread not found', { status: 404 });
    }

    try {
      await cancelRunOnThreadIfNeeded(threadId);
      return new Response('{}', {
        status: 200,
      });
    } catch (e) {
      console.log('Failed to cancel current Run: ', e);
      return new Response('{}', {
        status: 200,
      });
    }
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
