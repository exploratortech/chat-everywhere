// TODO: this is a WIP api route for Edge runtime
import { createSignature } from '@/utils/server/google/signature';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export const config = {
  runtime: 'edge',
};
const BUCKET_NAME = process.env.GCP_CHAT_WITH_DOCUMENTS_BUCKET_NAME as string;
const CLIENT_EMAIL = process.env.GCP_CLIENT_EMAIL as string;
const PRIVATE_KEY = process.env.GCP_PRIVATE_KEY as string;

export default async function handler(req: Request) {
  const { method } = req;
  if (method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
    });
  }
  const requestData = await req.json();
  const fileName = requestData.fileName;

  if (!fileName) {
    return new Response('File name is required', {
      status: 400,
    });
  }

  const userProfile = { id: '98ba69f3-5648-4951-8308-128a90a6f770' };
  const folderPath = userProfile.id;
  const objectPath = `${folderPath}/${fileName}`;

  // Construct the canonical request
  const expiration = 3600; // URL valid for 1 hour
  const canonicalRequest = `PUT\n/${BUCKET_NAME}/${objectPath}\n\nhost:storage.googleapis.com\ncontent-type:application/octet-stream\nx-goog-date:${dayjs()
    .utc()
    .format('YYYYMMDDTHHmmss[Z]')}\nx-goog-expires:${expiration}`;

  // Convert the string to a Uint8Array
  const encoder = new TextEncoder();
  const encodedCanonicalRequest = encoder.encode(canonicalRequest);

  const hashedCanonicalRequest = await crypto.subtle.digest(
    'SHA-256',
    encodedCanonicalRequest,
  );

  // Create the string-to-sign
  const credentialScope = `${dayjs().format(
    'YYYYMMDD',
  )}/auto/storage/goog4_request`;
  const stringToSign = `GOOG4-RSA-SHA256\n${dayjs()
    .utc()
    .format(
      'YYYYMMDDTHHmmss[Z]',
    )}\n${credentialScope}\n${hashedCanonicalRequest}`;

  // Generate the signature
  const signature = await createSignature(stringToSign);

  const algorithm = 'GOOG4-RSA-SHA256';
  const credential = `${CLIENT_EMAIL}/${dayjs().format(
    'YYYYMMDD',
  )}/auto/storage/goog4_request`;
  const date = dayjs().utc().format('YYYYMMDDTHHmmss[Z]');

  const generatePolicyDocumentHash = () => {
    const expirationDate = dayjs().add(expiration, 'seconds').toISOString();

    const policyDocument = {
      expiration: expirationDate,
      conditions: [
        { bucket: BUCKET_NAME },
        ['starts-with', '$key', `${objectPath}`],
        { acl: 'bucket-owner-full-control' },
        ['content-length-range', 0, 10485760], // 10 MB max file size
        { 'x-goog-algorithm': algorithm },
        {
          'x-goog-credential': credential,
        },
        { 'x-goog-date': date },
      ],
    };

    const stringifiedPolicy = JSON.stringify(policyDocument);
    const encodedPolicy = btoa(unescape(encodeURIComponent(stringifiedPolicy))); // Properly handle Unicode characters
    return encodedPolicy;
  };

  const fields = {
    'x-goog-algorithm': algorithm,
    'x-goog-credential': credential,
    'x-goog-date': date,
    'x-goog-signature': signature,
  };
  // Construct the signed URL
  // const queryParams = new URLSearchParams(fields);

  // const signedUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${objectPath}?${queryParams}`;
  const url = `https://storage.googleapis.com/${BUCKET_NAME}/`;

  return new Response(
    JSON.stringify({
      url: url,
      fields: {
        ...fields,
        key: objectPath,
        policy: generatePolicyDocumentHash(),
        acl: 'bucket-owner-full-control',
      },
    }),
    {
      status: 200,
    },
  );
}
