import { getAccessToken, origins } from './auth';

const BUCKET_NAME = process.env.GCP_CHAT_WITH_DOCUMENTS_BUCKET_NAME as string;
export async function updateBucketCORS() {
  const accessToken = await getAccessToken(); // Assuming getAccessToken() is available from the imported utils

  const url = `https://storage.googleapis.com/storage/v1/b/${BUCKET_NAME}?fields=cors`;

  const corsConfig = {
    cors: [
      {
        origin: origins(),
        method: ['GET', 'POST', 'PUT'],
        responseHeader: [
          'Content-Type',
          'x-goog-meta-user-id',
          'x-goog-meta-file-name',
        ],
        maxAgeSeconds: 3600,
      },
    ],
  };

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(corsConfig),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating CORS configuration:', error);
    throw error;
  }
}
