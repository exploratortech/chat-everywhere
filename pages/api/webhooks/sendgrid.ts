import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { getAdminSupabaseClient } from '@/utils/server/supabase';

import { EventWebhook } from '@sendgrid/eventwebhook';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

type SendGridPayload = {
  email: string;
  timestamp: number;
  'smtp-id': string;
  event: string;
  category: string[];
  sg_event_id: string;
  sg_message_id: string;
  sg_template_id: string;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const publicKey = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY || '';
  const signature =
    req.headers.get('X-Twilio-Email-Event-Webhook-Signature') || '';
  const timestamp =
    req.headers.get('X-Twilio-Email-Event-Webhook-Timestamp') || '';
  const payload = await req.text();

  const eventWebhook = new EventWebhook();
  const key = eventWebhook.convertPublicKeyToECDSA(publicKey);
  const isValidWebHookEvent = eventWebhook.verifySignature(
    key,
    payload,
    signature,
    timestamp,
  );

  if(!isValidWebHookEvent) {
    return new Response('Invalid webhook event', { status: 400 });
  }

  const eventPayload = JSON.parse(payload) as SendGridPayload[];
  const openedEvents = eventPayload.filter(
    (event) =>
      event.event === 'open' &&
      event.sg_template_id === 'd-e5fff0aa9b5948b4871c436812392134',
  );

  for (const event of openedEvents) {
    const supabase = getAdminSupabaseClient();

    const { data: user } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', event.email)
      .single();

    if (user) {
      await serverSideTrackEvent(user.id, `Trial end email opened`);
      console.log('Trial end email opened on user with email', user.email);
    }
  }

  return new Response('', { status: 200 });
};

export default handler;
