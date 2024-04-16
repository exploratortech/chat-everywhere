import type { NextApiRequest, NextApiResponse } from 'next';

import { getBucket } from '@/utils/server/gcpBucket';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const folderPath = 'user-id';
  if (req.method === 'GET') {
    const folderPath = 'myFolder';

    try {
      const bucket = await getBucket();
      const bucketRes = await bucket.getFiles({ prefix: folderPath });
      console.log(bucketRes);
      const [files] = bucketRes;
      res.status(200).json({ files });
    } catch (err) {
      if (err instanceof Error) {
        return res.status(500).send(err.message);
      }
      res.status(500).send('Internal server error');
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
