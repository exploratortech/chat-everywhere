import {
  fetchUserProfileWithAccessToken,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { getAccessToken } from '@/utils/server/google/auth';

import { UserFile } from '@/types/UserFile';
import { StorageObject } from '@/types/google-storage';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method === 'GET') {
    const userProfile = await fetchUserProfileWithAccessToken(req);
    if (!userProfile || !userProfile.isTeacherAccount)
      return unauthorizedResponse;
    const folderPath = userProfile.id;
    const BUCKET_NAME = process.env
      .GCP_CHAT_WITH_DOCUMENTS_BUCKET_NAME as string;

    try {
      const apiUrl = `https://storage.googleapis.com/storage/v1/b/${BUCKET_NAME}/o?prefix=${folderPath}`;
      const accessToken = await getAccessToken();
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error.message);
      }
      const files = (data.items || []) as StorageObject[];
      const userFiles: UserFile[] = files.map((file) => ({
        id: file.id,
        filename:
          file.metadata && file.metadata['file-name']
            ? file.metadata['file-name']
            : file.name.replace(new RegExp(`^${userProfile.id}/`), ''),
        filetype: file.contentType,
        timeCreated: file.timeCreated,
        objectPath: file.name,
        size: file.size,
      }));
      return new Response(
        JSON.stringify({
          files: userFiles.sort(
            (a, b) =>
              new Date(b.timeCreated).getTime() -
              new Date(a.timeCreated).getTime(),
          ),
        }),
        {
          status: 200,
        },
      );
    } catch (err) {
      if (err instanceof Error) {
        return new Response(JSON.stringify(err.message), {
          status: 500,
        });
      }
      return new Response(JSON.stringify('Internal server error'), {
        status: 500,
      });
    }
  } else {
    return new Response(JSON.stringify(`Method ${req.method} Not Allowed`), {
      status: 405,
    });
  }
}
