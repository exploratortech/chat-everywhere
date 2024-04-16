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
  const fileName = body.fileName;

  if (!fileName) {
    return res.status(400).json('File name is required');
  }

  const userProfile = await fetchUserProfileWithAccessTokenServerless(req);
  if (!userProfile || !userProfile.isTeacherAccount)
    return unauthorizedResponse;
  const folderPath = userProfile.id;
  const fileWithPath = `${folderPath}/${fileName}`;

  const bucket = await getBucket();
  const file = bucket.file(fileWithPath);

  const options = {
    expires: Date.now() + 5 * 60 * 1000,
    fields: { 'x-goog-meta-user-id': userProfile.id },
  };
  const [response] = await file.generateSignedPostPolicyV4(options);
  return res.status(200).json(response);
}
