import { NextApiRequest, NextApiResponse } from 'next';

import {
  fetchUserProfileWithAccessTokenServerless,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { getBucket } from '@/utils/server/gcpBucket';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'GET') {
    const userProfile = await fetchUserProfileWithAccessTokenServerless(req);
    if (!userProfile || !userProfile.isTeacherAccount)
      return unauthorizedResponse;
    const folderPath = userProfile.id;

    try {
      const bucket = await getBucket();
      const bucketRes = await bucket.getFiles({ prefix: folderPath });
      console.log(bucketRes);
      const [files] = bucketRes;
      return res.status(200).json({ files });
    } catch (err) {
      if (err instanceof Error) {
        return res.status(500).json(err.message);
      }
      return res.status(500).json('Internal server error');
    }
  } else {
    return res.status(405).json(`Method ${req.method} Not Allowed`);
  }
}
