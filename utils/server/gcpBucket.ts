import { Storage } from '@google-cloud/storage';

const BUCKET_NAME = process.env.GCP_CHAT_WITH_DOCUMENTS_BUCKET_NAME as string;
const PROJECT_ID = process.env.GCP_PROJECT_ID as string;
const CLIENT_EMAIL = process.env.GCP_CLIENT_EMAIL as string;
const PRIVATE_KEY = process.env.GCP_PRIVATE_KEY as string;

const origin = (() => {
  if (process.env.VERCEL_ENV === 'production') {
    return 'https://chateverywhere.app';
  }
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  return process.env.VERCEL_URL || 'http://localhost:3000';
})();

const responseHeader = 'Content-Type';
const maxAgeSeconds = 36000;
const method = 'GET';

const storage = new Storage({
  projectId: PROJECT_ID,
  credentials: {
    private_key: PRIVATE_KEY,
    client_email: CLIENT_EMAIL,
  },
});
const bucket = storage.bucket(BUCKET_NAME);
async function getBucketMetadata() {
  const [metadata] = await bucket.getMetadata();

  console.log(JSON.stringify(metadata, null, 2));
}
async function configureBucketCors() {
  await bucket.setCorsConfiguration([
    {
      maxAgeSeconds,
      method: [method, 'POST'],
      origin: [origin],
      responseHeader: [responseHeader],
    },
  ]);

  console.log(`Bucket ${BUCKET_NAME} was updated with a CORS config
      to allow ${method} requests from ${origin} sharing
      ${responseHeader} responses across origins`);
}

export async function getBucket() {
  await configureBucketCors();
  await getBucketMetadata();
  return bucket;
}
