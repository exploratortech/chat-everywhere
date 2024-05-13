import { NextApiRequest, NextApiResponse } from 'next';

import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { getAdminSupabaseClient } from '@/utils/server/supabase';

//import { EventWebhook } from '@sendgrid/eventwebhook';

type PostmarkPayload = {
  RecordType: string;
  MessageStream: string;
  FirstOpen: boolean;
  Client: {
    Name: string;
    Company: string;
    Family: string;
  };
  OS: {
    Name: string;
    Company: string;
    Family: string;
  };
  Platform: string;
  UserAgent: string;
  Geo: {
    CountryISOCode: string;
    Country: string;
    RegionISOCode: string;
    Region: string;
    City: string;
    Zip: string;
    Coords: string;
    IP: string;
  };
  MessageID: string;
  Metadata: {
    [key: string]: string;
  };
  ReceivedAt: string;
  Tag: string;
  Recipient: string;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log('Webhook triggered:', res);
  // if (req.method !== 'POST') {
  //   res.status(405).end('Method Not Allowed');
  // }

  // // const publicKey = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY || '';
  // // const signature = req.headers[
  // //   'x-twilio-email-event-webhook-signature'
  // // ] as string;
  // // const timestamp = req.headers[
  // //   'x-twilio-email-event-webhook-timestamp'
  // // ] as string;
  // const payload = req.body;
  // console.log('payload:', payload);
  // //const eventWebhook = new EventWebhook();
  // // const key = eventWebhook.convertPublicKeyToECDSA(publicKey);
  // // const isValidWebHookEvent = eventWebhook.verifySignature(
  // //   key,
  // //   payload,
  // //   signature,
  // //   timestamp,
  // // );

  // // if (!isValidWebHookEvent) {
  // //   return res.status(400).send(`Webhook signature verification failed.`);
  // // }

  // const eventPayload = payload
  // console.log('eventPayload:', eventPayload);
  // // const openedEvents = eventPayload.filter(
  // //   (event) =>
  // //     event.RecordType === "Open"
  // // );

  // const openedEvents = payload
  // for (const event of openedEvents) {
  //   const supabase = getAdminSupabaseClient();

  //   const { data: user } = await supabase
  //     .from('profiles')
  //     .select('id, email')
  //     .eq('email', event.Recipient)
  //     .single();

  //   if (user) {
  //     await serverSideTrackEvent(user.id, `Trial end email opened`);
  //     console.log('Trial end email opened on user with email', user.email);
  //   }
  //   console.log('No user found for:', event.Recipient);
  // }

  //return res.status(200);
};

export default handler;
