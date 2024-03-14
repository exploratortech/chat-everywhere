import { getHomeUrl } from '@/utils/app/api';
import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { allowAccountToUseLine, isStudentAccount } from '@/utils/server/auth';
import { getAdminSupabaseClient } from '@/utils/server/supabase';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const redirectHomeWithNotice = (
  notice: string,
  noticeType: 'success' | 'error' = 'error',
): Response => {
  const response = new Response('', { status: 302 });
  let homeUrl = getHomeUrl();
  response.headers.set(
    'Location',
    `${homeUrl}?notice=${notice}&noticeType=${noticeType}`,
  );
  return response;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const supabaseAccessToken = url.searchParams.get('state');

  if (!code || !supabaseAccessToken) {
    console.error('No code or access token found', code, supabaseAccessToken);
    return redirectHomeWithNotice(
      'Unable to connect with LINE, please try again later',
      'error',
    );
  }
  const supabase = getAdminSupabaseClient();
  const user = await supabase.auth.getUser(supabaseAccessToken);

  if (!user) {
    console.error('No user found with this access token');
    return redirectHomeWithNotice(
      'Unable to connect with LINE, please try again later',
      'error',
    );
  }

  // Check if account is student account, if so, should check if the teacher allow student to use line
  const userId = user.data.user?.id;
  if (!userId) {
    console.error('No user id found');
    return redirectHomeWithNotice(
      'Unable to connect with LINE, please try again later',
      'error',
    );
  }

  if (await isStudentAccount(userId)) {
    if (!(await allowAccountToUseLine(userId))) {
      console.error('Teacher does not allow student to use LINE');
      return redirectHomeWithNotice(
        'Teacher does not allow student to use LINE',
        'error',
      );
    }
  }

  // Retrieved the code, now exchange it for an access token
  const response = await fetch('https://notify-bot.line.me/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: `${getHomeUrl()}/api/webhooks/line-notify-connect`,
      client_id: process.env.NEXT_PUBLIC_LINE_NOTIFY_CLIENT_ID || '',
      client_secret: process.env.LINE_NOTIFY_CLIENT_SECRET || '',
    }),
  });

  if (!response.ok) {
    console.log(await response.text());

    console.error('Failed to exchange code for access token');
    return redirectHomeWithNotice(
      'Unable to connect with LINE, please try again later',
      'error',
    );
  }

  const data = await response.json();
  const accessToken = data.access_token;

  // Store the accessToken in the line_access_token column in the profiles table in Supabase
  const { error } = await supabase
    .from('profiles')
    .update({ line_access_token: accessToken })
    .match({ id: userId });

  if (error) {
    console.error('Failed to store access token:', error);
    return redirectHomeWithNotice(
      'Unable to connect with LINE, please try again later',
      'error',
    );
  }

  serverSideTrackEvent(user.data.user?.id || 'N/A', 'LINE Notify connected');
  return redirectHomeWithNotice('Successfully connected to LINE', 'success');
};

export default handler;
