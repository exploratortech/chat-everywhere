// TODO: figure out how to use the edge runtime for gen upload url
import {
  fetchUserProfileWithAccessToken,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { createSignature } from '@/utils/server/google/signature';
import { updateBucketCORS } from '@/utils/server/google/updateBucketCORS';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { v4 as uuidv4 } from 'uuid';

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
  const originalFileName = requestData.fileName;
  const fileMimeType = requestData.fileMimeType;

  if (!originalFileName) {
    return new Response('fileName is required', {
      status: 400,
    });
  }
  if (!fileMimeType) {
    return new Response('fileMimeType is required', {
      status: 400,
    });
  }
  const [userProfile] = await Promise.all([
    fetchUserProfileWithAccessToken(req),
    updateBucketCORS(),
  ]);
  if (!userProfile || userProfile.plan !== 'ultra') return unauthorizedResponse;

  const folderPath = userProfile.id;
  const randomUUID = uuidv4();
  const filteredFileName = `${originalFileName.replace(
    /[^a-zA-Z0-9]/g,
    '_',
  )}_${randomUUID}`;
  console.log({ filteredFileName });
  const objectPath = `${folderPath}/${filteredFileName}`;
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
    'Content-Type': fileMimeType,
    'x-goog-meta-user-id': userProfile.id,
    'x-goog-meta-file-name': originalFileName,
  };
  const signedHeaders = Object.keys(headers)
    .sort()
    .map((key) => key.toLowerCase())
    .join(';');
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((key) => {
      const value = key.startsWith('x-goog-meta')
        ? encodeURIComponent(headers[key as keyof typeof headers])
        : headers[key as keyof typeof headers];
      return `${key.toLowerCase()}:${value}\n`;
    })
    .join('');
  const queryParams = {
    'response-content-disposition': 'attachment; filename=' + filteredFileName,
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

  const encodedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      key.startsWith('x-goog-meta') ? encodeURIComponent(value) : value,
    ]),
  );
  return new Response(
    JSON.stringify({
      url: signedUrl,
      headers: encodedHeaders,
    }),
    {
      status: 200,
    },
  );
}
