import buttonCommand from '@/utils/server/next-lag/buttonCommands';
import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';

import { v4 } from 'uuid';

const supabase = getAdminSupabaseClient();

export const config = {
  runtime: 'edge',
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const handler = async (req: Request): Promise<Response> => {
  const userToken = req.headers.get('user-token');

  const { data, error } = await supabase.auth.getUser(userToken || '');
  if (!data || error) return unauthorizedResponse;

  const user = await getUserProfile(data.user.id);
  if (!user || user.plan === 'free') return unauthorizedResponse;

  const requestBody = await req.json();

  const { button, buttonMessageId } = requestBody;

  const requestHeader = {
    Authorization: `Bearer ${process.env.THE_NEXT_LEG_API_KEY || ''}`,
    'Content-Type': 'application/json',
  };

  try {
    const buttonCommandResponse = await buttonCommand(button, buttonMessageId);

    return new Response(JSON.stringify(buttonCommandResponse));
  } catch (error) {
    console.error(error);
    return new Response((error as Error).message, { status: 500 });
  }
};

export default handler;
