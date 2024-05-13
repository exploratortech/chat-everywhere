import {
  fetchUserProfileWithAccessToken,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { createSignature } from '@/utils/server/google/signature';
import { updateBucketCORS } from '@/utils/server/google/updateBucketCORS';

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
  const objectPath = requestData.objectPath;
  if (!objectPath) {
    return new Response('File name is required', {
      status: 400,
    });
  }
  const [userProfile] = await Promise.all([
    fetchUserProfileWithAccessToken(req),
    updateBucketCORS(),
  ]);
  if (!userProfile || userProfile.plan !== 'ultra') return unauthorizedResponse;

  if (!objectPath.includes(userProfile.id)) {
    return unauthorizedResponse;
  }

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
    'response-content-disposition': 'attachment; filename=' + objectPath,
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
    'GET',
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

  const signedUrl = `${schemeAndHost}${canonicalUri}?${canonicalQueryString}&X-Goog-Signature=${signature}`;

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
