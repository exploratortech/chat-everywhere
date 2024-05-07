import { NextApiRequest, NextApiResponse } from 'next';

import {
  fetchUserProfileWithAccessTokenServerless,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { getBucket } from '@/utils/server/gcpBucket';

const BUCKET_NAME = process.env.GCP_CHAT_WITH_DOCUMENTS_BUCKET_NAME as string;
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { body, method } = req;
  if (method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const objectPath = body.objectPath;
  if (!objectPath) {
    return res.status(400).json({ error: 'Object ID is required' });
  }

  const userProfile = await fetchUserProfileWithAccessTokenServerless(req);
  if (!userProfile || !userProfile.isTeacherAccount) {
    return unauthorizedResponse;
  }

  const bucket = await getBucket();
  const file = bucket.file(objectPath);

  try {
    await file.delete();
    return res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error deleting file:', error.message);
      return res.status(500).json({
        error: `Failed to delete the file: ${error.message}`,
      });
    }
    return res.status(500).json({ error: 'Failed to delete the file' });
  }
}
