import { trackEvent } from '@/utils/app/eventTracking';
import { getAdminSupabaseClient } from '@/utils/server/supabase';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { accessToken, messageContent } = (await req.json()) as {
    accessToken: string;
    messageContent: string;
  };

  if (!accessToken || !messageContent) {
    return new Response('Missing sessionId or messageContent', { status: 400 });
  }

  const supabase = getAdminSupabaseClient();
  const user = await supabase.auth.getUser(accessToken);

  if (!user) {
    console.error('No user found with this access token');
    return new Response('No user found with this access token', {
      status: 400,
    });
  }

  // Retrieve access token from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('line_access_token')
    .match({ id: user.data.user?.id })
    .single();

  if (!profile || profileError) {
    console.error('Error fetching user profile:', profileError);
    return new Response('Error fetching user profile', { status: 500 });
  }

  const lineAccessToken = profile.line_access_token as string;

  // Send message to LINE
  const response = await fetch('https://notify-api.line.me/api/notify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${lineAccessToken}`,
    },
    body: `message=${encodeURIComponent(messageContent)}`,
  });

  if (!response.ok) {
    if (response.status === 401) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ line_access_token: null })
        .match({ id: user.data.user?.id });

      if (updateError) {
        console.error('Error updating user profile:', updateError);
      }
      return new Response('Invalid access token', { status: 401 });
    }
    return new Response('Failed to send message to LINE', { status: 500 });
  }

  trackEvent('Share to Line');
  return new Response('', { status: 200 });
};

export default handler;
