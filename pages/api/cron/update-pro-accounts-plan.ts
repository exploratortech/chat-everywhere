import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import {
  getAdminSupabaseClient,
  getTrialExpiredUserProfiles,
  updateProAccountsPlan,
} from '@/utils/server/supabase';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { ServerClient } from 'postmark';

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

const postmarkClient = new ServerClient(process.env.POSTMARK_SERVER_TOKEN || '');

const sendOutTrialEndEmail = async (userEmail: string) => {
  try {
    const response = await postmarkClient.sendEmailWithTemplate({
      From: "Chat Everywhere Team <team@chateverywhere.app>",
      ReplyTo: 'Jack <jack@exploratorlabs.com>',
      To: userEmail,
      TemplateId: 35875013, // Replace with your actual numeric template ID
      TemplateModel: {
        // The properties here should match the variables in your Postmark template
        "product_url": "product_url_Value",
        "product_name": "Chat Everywhere",
        "action_url": "action_url_Value",
        "trial_extension_url": "trial_extension_url_Value",
        "feedback_url": "feedback_url_Value",
        "export_url": "export_url_Value",
        "close_account_url": "close_account_url_Value",
        "sender_name": "sender_name_Value",
        "company_name": "company_name_Value",
        "company_address": "company_address_Value"
      }
    });
    console.log('Email sent successfully:', response);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to send email:', error.message);
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }
};

export default handler;
