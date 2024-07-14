import { origins } from './google/auth';

import { Storage } from '@google-cloud/storage';

const BUCKET_NAME = process.env.GCP_CHAT_WITH_DOCUMENTS_BUCKET_NAME as string;
const PROJECT_ID = process.env.GCP_PROJECT_ID as string;
const CLIENT_EMAIL = process.env.GCP_CLIENT_EMAIL as string;
const PRIVATE_KEY = process.env.GCP_PRIVATE_KEY as string;

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
type BucketMetadata = {
  kind: string;
  selfLink: string;
  id: string;
  name: string;
  projectNumber: string;
  metageneration: string;
  location: string;
  storageClass: string;
  etag: string;
  timeCreated: string;
  updated: string;
  cors: Array<{
    origin: string[];
    method: string[];
    responseHeader: string[];
    maxAgeSeconds: number;
  }>;
  softDeletePolicy: {
    retentionDurationSeconds: string;
    effectiveTime: string;
  };
  iamConfiguration: {
    bucketPolicyOnly: {
      enabled: boolean;
      lockedTime: string;
    };
    uniformBucketLevelAccess: {
      enabled: boolean;
      lockedTime: string;
    };
    publicAccessPrevention: string;
  };
  locationType: string;
};

async function getBucketMetadata(): Promise<BucketMetadata | null> {
  try {
    const [metadata] = (await bucket.getMetadata()) as unknown as [
      BucketMetadata,
    ];
    return metadata;
  } catch (error) {
    return null;
  }
}
async function checkCorsOrigins(metadata: BucketMetadata) {
  const cors = metadata.cors;
  const hostOrigins = origins();
  const corsOrigins = cors.flatMap((cors) => cors.origin);
  const corsOriginsSet = new Set(corsOrigins);
  const hostOriginsSet = new Set(hostOrigins);
  return (
    corsOriginsSet.size === hostOriginsSet.size &&
    Array.from(corsOriginsSet).every((origin) => hostOriginsSet.has(origin))
  );
}
async function configureBucketCors() {
  try {
    const metadata = await getBucketMetadata();
    const originsIsSet = metadata && (await checkCorsOrigins(metadata));
    if (!originsIsSet) {
      console.log('setting cors');
      await bucket.setCorsConfiguration([
        {
          maxAgeSeconds,
          method: ['GET', 'POST'],
          origin: origins(),
          responseHeader: [responseHeader],
        },
      ]);
    }
  } catch (error) {
    console.error('Error configuring bucket CORS:', error);
    throw error; // Re-throw the error if you want calling functions to handle it
  }
}
export async function getBucket() {
  await configureBucketCors();
  return bucket;
}
