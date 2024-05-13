import { NextApiRequest, NextApiResponse } from 'next';
import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { getAdminSupabaseClient } from '@/utils/server/supabase';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const payload: PostmarkPayload = req.body;

  // Verifying the authenticity of request 
  if (req.method !== 'POST') {
    res.status(405).end('Method Not Allowed');
  }
  const tokenHeaderName = 'x-custom-auth-token';
  const expectedToken = process.env.POSTMARK_WEBHOOK_KEY;
  const providedToken = req.headers[tokenHeaderName];
  // Check if the token matches the expected value
  if (!providedToken || providedToken !== expectedToken) {
    res.status(401).end('Unauthorized');
    return;
  }
  
  // Check if the RecordType is 'Open'
  if (payload.RecordType === 'Open') {
    const supabase = getAdminSupabaseClient();
    // Fetch the user from your database using the recipient's email
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', payload.Recipient)
      .single();
    // If a user is found, track the event and log it
    if (user) {
      // Replace `serverSideTrackEvent` with your actual event tracking function
      await serverSideTrackEvent(user.id, `Trial end email opened`);
      console.log('Trial end email opened on user with email', user.email);
    } else if (error) {
      console.error('Error fetching user:', error);
    } else {
      console.log('No user found for:', payload.Recipient);
    }
  }
  
  // Respond to Postmark to acknowledge receipt of the webhook
  res.status(200).json({ message: 'Webhook received' });
}