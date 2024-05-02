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
  const { body, method } = req;
  if (method !== 'POST') {
    return res.status(405).json('Method not allowed');
  }
  const objectPath = body.objectPath;

  if (!objectPath) {
    return res.status(400).json('File name is required');
  }

  const userProfile = await fetchUserProfileWithAccessTokenServerless(req);
  if (!userProfile || !userProfile.isTeacherAccount)
    return unauthorizedResponse;
  if (!objectPath.includes(userProfile.id)) {
    return unauthorizedResponse;
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
