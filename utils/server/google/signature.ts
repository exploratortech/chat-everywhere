import { getAccessToken } from './auth';

const serviceAccountEmail = process.env.GCP_CLIENT_EMAIL as string;

export async function createSignature(payload: string): Promise<string> {
  const accessToken = await getAccessToken();

  const url = `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:signBlob`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        payload: Buffer.from(payload).toString('base64'),
      }),
    });

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${
          response.status
        }, response: ${await response.text()}`,
      );
    }

    const data = await response.json();
    console.log({ data });

    return data.signedBlob;
  } catch (error) {
    console.error('Error creating signature:', error);
    throw error;
  }
}
