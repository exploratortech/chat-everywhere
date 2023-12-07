// This endpoint will retrieve the last and only retained message on the topic
import { NextApiRequest, NextApiResponse } from 'next';

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
  const authToken = req.headers['auth-token'] as string;

  let user = null;

  if (!authToken || authToken !== process.env.AUTH_TOKEN) {
    const { data, error } = await supabase.auth.getUser(userToken || '');
    if (!data || error) {
      return res.status(401).json({
        payload: 'Unauthorized',
      });
    }

    user = await getUserProfile(data.user.id);
    if (!user || user.plan === 'free') {
      return res.status(401).json({
        payload: 'Unauthorized',
      });
    }
  }

  const { topic: requestedTopic } = req.body as {
    topic: string;
  };

  if (!requestedTopic) {
    return res.status(400).json({
      payload: 'Missing topic',
    });
  }

  const client = await mqtt.connectAsync('mqtt://broker.emqx.io');
  let payload: string | null = null;

  try {
    client.subscribe(requestedTopic, {}, () => {
      client.on('message', (topic, message) => {
        console.log('Received Message:', topic, message.toString());

        if (topic === requestedTopic) {
          payload = message.toString();
        }
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 350));
    client.end();

    if (payload) {
      return res.status(200).json({
        payload: payload,
      });
    } else {
      return res.status(201).json({
        payload: 'No payload received',
      });
    }
  } catch (e) {
    return res.status(500).json({
      payload: 'Internal Server Error',
    });
  }
}
