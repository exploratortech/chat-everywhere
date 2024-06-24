import { NextApiRequest, NextApiResponse } from 'next';

import {
  fetchUserProfileWithAccessTokenServerless,
  unauthorizedResponseServerless,
} from '@/utils/server/auth';
import { getBucket } from '@/utils/server/gcpBucket';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { body, method } = req;
  if (method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
    });
  }

  const objectPath = body.objectPath;
  if (!objectPath) {
    return new Response('File name is required', {
      status: 400,
    });
  }

  const userProfile = await fetchUserProfileWithAccessTokenServerless(req);
  if (!userProfile || userProfile.plan !== 'ultra')
    return unauthorizedResponseServerless(res);

  if (!objectPath.includes(userProfile.id)) {
    return unauthorizedResponseServerless(res);
  }

  const bucket = await getBucket();
  const file = bucket.file(objectPath);

  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 5 * 60 * 1000,
  });

  return res.status(200).json({
    url,
  });
}
