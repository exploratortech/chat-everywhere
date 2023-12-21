import { NextApiRequest, NextApiResponse } from 'next';

import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { getAdminSupabaseClient } from '@/utils/server/supabase';

import { EventWebhook } from '@sendgrid/eventwebhook';

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

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.status(405).end('Method Not Allowed');
  }

  const publicKey = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY || '';
  const signature = req.headers[
    'X-Twilio-Email-Event-Webhook-Signature'
  ] as string;
  const timestamp = req.headers[
    'X-Twilio-Email-Event-Webhook-Timestamp'
  ] as string;
  const payload = req.body;

  const eventWebhook = new EventWebhook();
  const key = eventWebhook.convertPublicKeyToECDSA(publicKey);
  const isValidWebHookEvent = eventWebhook.verifySignature(
    key,
    payload,
    signature,
    timestamp,
  );

  if (!isValidWebHookEvent) {
    return res.status(400).send(`Webhook signature verification failed.`);
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

  return res.status(200);
};

export default handler;
