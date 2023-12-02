import { NextApiRequest, NextApiResponse } from 'next';

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

  const { topic, message } = req.body as {
    topic: string;
    message: string;
  };

  if (!topic || !message) {
    res.status(400).json({
      message: 'Missing payload',
    });
  }

  let client = await mqtt.connectAsync('mqtt://broker.emqx.io');
  let requestResponse = await client.publishAsync(topic, message);

  console.log(requestResponse);

  // serverSideTrackEvent(user.data.user?.id || 'N/A', 'Share to Line');
  res.status(200).json({
    message: 'OK',
  });
}
