import type { NextApiRequest, NextApiResponse } from 'next';

import { getBucket } from '@/utils/server/gcpBucket';

import { SignedPostPolicyV4Output } from '@google-cloud/storage';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignedPostPolicyV4Output | string>,
) {
  const { body, method } = req;
  if (method !== 'POST') {
    res.status(405).json('Method not allowed');
    return;
  }

  const bucket = await getBucket();

  const folderPath = 'myFolder';
  const fileName = body.file as string;
  const fileWithPath = `${folderPath}/${fileName}`;

  const file = bucket.file(fileWithPath);

  const options = {
    expires: Date.now() + 5 * 60 * 1000,
    fields: { 'x-goog-meta-user-id': 'test-value' },
  };
  const [response] = await file.generateSignedPostPolicyV4(options);
  res.status(200).json(response);
}
