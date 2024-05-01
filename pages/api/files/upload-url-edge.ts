import { origins } from '@/utils/server/google/auth';
import { getAccessToken } from '@/utils/server/google/auth';
import { createSignature } from '@/utils/server/google/signature';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export const config = {
  runtime: 'edge',
};
const BUCKET_NAME = process.env.GCP_CHAT_WITH_DOCUMENTS_BUCKET_NAME as string;
const CLIENT_EMAIL = process.env.GCP_CLIENT_EMAIL as string;

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
  await updateBucketCORS();

  const userProfile = { id: '98ba69f3-5648-4951-8308-128a90a6f770' };
  const folderPath = userProfile.id;
  const objectPath = `${folderPath}/${fileName}`;
  const expiration = 3600;

  const escapedObjectName = encodeURIComponent(objectPath);
  const canonicalUri = `/${escapedObjectName}`;

  const dateTimeNow = dayjs().utc();
  const requestTimestamp = dateTimeNow.format('YYYYMMDDTHHmmss[Z]');
  const dateStamp = dateTimeNow.format('YYYYMMDD');

  const clientEmail = CLIENT_EMAIL;
  const credentialScope = `${dateStamp}/auto/storage/goog4_request`;
  const credential = `${clientEmail}/${credentialScope}`;

  const host = `${BUCKET_NAME}.storage.googleapis.com`;
  const headers = {
    host: host,
  };
  const signedHeaders = Object.keys(headers)
    .map((key) => key.toLowerCase())
    .sort()
    .join(';');
  const canonicalHeaders = Object.keys(headers)
    .map(
      (key) =>
        `${key.toLowerCase()}:${headers[
          key as keyof typeof headers
        ].toLowerCase()}\n`,
    )
    .join('');
  const queryParams = {
    'response-content-disposition': 'attachment; filename=' + fileName,
    'X-Goog-Algorithm': 'GOOG4-RSA-SHA256',
    'X-Goog-Credential': credential,
    'X-Goog-Date': requestTimestamp,
    'X-Goog-Expires': expiration,
    'X-Goog-SignedHeaders': signedHeaders,
  };
  const canonicalQueryString = Object.keys(queryParams)
    .sort()
    .map(
      (key) =>
        `${key}=${encodeURIComponent(
          queryParams[key as keyof typeof queryParams],
        )}`,
    )
    .join('&');
  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  async function hashCanonicalRequest(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return hashHex;
  }

  const canonicalRequestHash = await hashCanonicalRequest(canonicalRequest);

  const stringToSign = [
    'GOOG4-RSA-SHA256',
    requestTimestamp,
    credentialScope,
    canonicalRequestHash,
  ].join('\n');

  const signature = await createSignature(stringToSign);

  const schemeAndHost = `https://${host}`;

  const signedUrl = `${schemeAndHost}${canonicalUri}?${canonicalQueryString}&x-goog-signature=${signature}`;

  return new Response(
    JSON.stringify({
      url: signedUrl,
      stringToSign,
      canonicalRequest,
      signature,
    }),
    {
      headers: headers,
      status: 200,
    },
  );
}
async function updateBucketCORS() {
  const accessToken = await getAccessToken(); // Assuming getAccessToken() is available from the imported utils

  const url = `https://storage.googleapis.com/storage/v1/b/${BUCKET_NAME}?fields=cors`;

  const corsConfig = {
    cors: [
      {
        origin: origins(),
        method: ['GET', 'POST', 'PUT'],
        responseHeader: ['Content-Type'],
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
