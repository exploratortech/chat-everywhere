import { getAdminSupabaseClient } from '@/utils/server/supabase';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1'
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const supabaseAccessToken = url.searchParams.get('state');
  
  if(!code || !supabaseAccessToken) {
    console.error('No code or access token found');
    return new Response('No code or access token found', { status: 400 });
  }
  console.log('Code:', code);

  // Retrieved the code, now exchange it for an access token
  const response = await fetch('https://notify-bot.line.me/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      'grant_type': 'authorization_code',
      'code': code,
      'redirect_uri': 'http://localhost:3000/api/webhooks/line-notify-connect',
      'client_id': process.env.LINE_NOTIFY_CLIENT_ID || '',
      'client_secret': process.env.LINE_NOTIFY_CLIENT_SECRET || ''
    })
  });

  if (!response.ok) {
    console.error('Failed to exchange code for access token');
    return new Response('Failed to exchange code for access token', { status: 500 });
  }

  const data = await response.json();
  const accessToken = data.access_token;
  
  const supabase = getAdminSupabaseClient();

  const user = await supabase.auth.getUser(supabaseAccessToken);

  if(!user) {
    console.error('No user found with this access token');
    return new Response('No user found with this access token', { status: 400 });
  }

  // Store the accessToken in the line_access_token column in the profiles table in Supabase
  const { error } = await supabase
    .from('profiles')
    .update({ line_access_token: accessToken })
    .match({ id: user.data.user?.id });

  if (error) {
    console.error('Failed to store access token:', error);
    return new Response('Failed to store access token', { status: 500 });
  }

  console.log('User ID:', user.data.user?.id);

  const redirectResponse = new Response('', { status: 302 });
  redirectResponse.headers.set('Location', 'http://localhost:3000/');
  return redirectResponse;
}

export default handler;
