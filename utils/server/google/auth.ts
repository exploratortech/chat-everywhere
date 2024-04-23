import { SignJWT, importPKCS8 } from 'jose';
import fetch from 'node-fetch';

// TODO: update the variable name
const CLIENT_EMAIL = process.env.GCP_CLIENT_EMAIL as string;
const PRIVATE_KEY = process.env.GCP_PRIVATE_KEY as string;
const PRIVATE_KEY_ID = process.env.GCP_PRIVATE_KEY_ID as string;

// TODO: replace this with argument
const API_ENDPOINT = 'https://us-east1-aiplatform.googleapis.com'; // Example API endpoint

async function createSignedJwt() {
  const privateKey = await importPKCS8(PRIVATE_KEY, 'RS256');

  const payload = {
    iss: CLIENT_EMAIL,
    scope:
      'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/cloud-platform.read-only',
    aud: 'https://oauth2.googleapis.com/token',
    exp: Math.floor(Date.now() / 1000) + 60,
    iat: Math.floor(Date.now() / 1000),
  };

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', kid: PRIVATE_KEY_ID })
    .sign(privateKey);
  return jwt;
}

export async function getAccessToken() {
  const jwt = await createSignedJwt();

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await response.json();
  const accessToken = data.access_token;

  return accessToken;
}
