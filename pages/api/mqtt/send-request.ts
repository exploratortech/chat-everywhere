import { NextApiRequest, NextApiResponse } from 'next';

import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';

import mqtt from 'mqtt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.status(405).json({
      message: 'Method not allowed',
    });
  }
  const supabase = getAdminSupabaseClient();
  const userToken = req.headers['user-token'] as string;

  const { data, error } = await supabase.auth.getUser(userToken || '');
  if (!data || error) {
    return res.status(401).json({
      message: 'Unauthorized',
    });
  }

  const user = await getUserProfile(data.user.id);
  if (!user || user.plan === 'free') {
    return res.status(401).json({
      message: 'Unauthorized',
    });
  }

  const { topic, message } = req.body as {
    topic: string;
    message: string;
  };

  if (!topic || !message) {
    return res.status(400).json({
      message: 'Missing payload',
    });
  }

  const client = await mqtt.connectAsync('mqtt://broker.emqx.io');

  try {
    await client.publishAsync(topic, message);

    serverSideTrackEvent(user.id || 'N/A', 'MQTT send request');
    return res.status(200).json({
      message: 'OK',
    });
  } catch (e) {
    return res.status(500).json({
      message: 'Internal Server Error',
    });
  }
}
