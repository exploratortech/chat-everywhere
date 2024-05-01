import { Storage } from '@google-cloud/storage';

const BUCKET_NAME = process.env.GCP_CHAT_WITH_DOCUMENTS_BUCKET_NAME as string;
const PROJECT_ID = process.env.GCP_PROJECT_ID as string;
const CLIENT_EMAIL = process.env.GCP_CLIENT_EMAIL as string;
const PRIVATE_KEY = process.env.GCP_PRIVATE_KEY as string;

const origins = () => {
  if (process.env.NODE_ENV === 'development') {
    return ['http://localhost:3000'];
  }
  return [
    `https://${process.env.VERCEL_URL}`,
    `https://${process.env.VERCEL_BRANCH_URL}`,
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
    'https://chateverywhere.app',
  ];
};

const responseHeader = 'Content-Type';
const maxAgeSeconds = 36000;

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
  // FOR DEBUG
  console.log(JSON.stringify(metadata, null, 2));
}
async function configureBucketCors() {
  console.log({
    settingOrigin: origins(),
  });
  await bucket.setCorsConfiguration([
    {
      maxAgeSeconds,
      method: ['GET', 'POST'],
      origin: origins(),
      responseHeader: [responseHeader],
    },
  ]);
}

export async function getBucket() {
  await configureBucketCors();
  return bucket;
}
