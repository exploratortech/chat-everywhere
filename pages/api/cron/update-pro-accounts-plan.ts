import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import {
  getAdminSupabaseClient,
  getTrialExpiredUserProfiles,
  updateProAccountsPlan,
} from '@/utils/server/supabase';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const trialEndUserIds = await getTrialExpiredUserProfiles();
    const supabase = getAdminSupabaseClient();

    for (const userId of trialEndUserIds) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', userId)
        .single();
      if (userProfile) {
        sendOutTrialEndEmail(userProfile.email);
        await serverSideTrackEvent(userProfile.id, 'Trial end email sent');
      }
    }

    await updateProAccountsPlan();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

const sendOutTrialEndEmail = async (userEmail: string) => {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
    },
    body: JSON.stringify({
      from: {
        email: 'team@chateverywhere.app',
        name: 'Chat Everywhere Team',
      },
      reply_to: {
        email: 'jack@exploratorlabs.com',
        name: 'Jack',
      },
      personalizations: [
        {
          to: [
            {
              email: userEmail,
            },
          ],
        },
      ],
      template_id: 'd-e5fff0aa9b5948b4871c436812392134',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send email: ${response.statusText}`);
  }
};

export default handler;
