import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { getAdminSupabaseClient } from '@/utils/server/supabase';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { accessToken } = (await req.json()) as {
    accessToken: string;
  };

  if (!accessToken) {
    return new Response('Missing accessToken', {
      status: 400,
    });
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

  // Revoke access token from LINE
  const response = await fetch('https://notify-api.line.me/api/revoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${lineAccessToken}`,
    },
  });

  if (!response.ok) {
    console.error(await response.text());
  }

  // Remove line_access_token for this user in the profiles table
  const { error: removeError } = await supabase
    .from('profiles')
    .update({ line_access_token: null })
    .match({ id: user.data.user?.id });

  if (removeError) {
    console.error('Error removing line_access_token:', removeError);
    return new Response('Error removing line_access_token', { status: 500 });
  }

  serverSideTrackEvent(user.data.user?.id || 'N/A', 'Disconnect LINE Notify');
  return new Response('', { status: 200 });
};

export default handler;
