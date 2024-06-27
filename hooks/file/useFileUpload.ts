import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import useHomeLoadingBar from '../useHomeLoadingBar';

export function useFileUpload() {
  const supabase = useSupabaseClient();
  const { t: commonT } = useTranslation('common');
  const { withLoading } = useHomeLoadingBar();

  const uploadFileMutation = useMutation(
    async ({
      filename,
      file,
      onProgress,
    }: {
      filename: string;
      file: File;
      onProgress?: (progress: number) => void;
    }) =>
      withLoading(async () => {
        const accessToken = (await supabase.auth.getSession()).data.session
          ?.access_token!;
        const result = await fetch(`/api/files/upload-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access-token': accessToken,
          },
          body: JSON.stringify({
            fileName: filename,
            fileMimeType: file.type,
          }),
        });
        const { url, headers, fields } = await result.json();

        return new Promise((resolve, reject) => {
          const formData = new FormData();

          if (fields) {
            Object.entries({ ...fields }).forEach(([key, value]) => {
              formData.append(key, value as string | Blob);
            });
          }
          formData.append('file', file);
          const xhr = new XMLHttpRequest();
          xhr.open('POST', url);
          if (headers) {
            for (const [key, value] of Object.entries(headers)) {
              if (key === 'host') continue;
              xhr.setRequestHeader(`${key}`, value as string);
            }
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(true);
            } else {
              reject(xhr.statusText);
            }
          };
          xhr.onerror = () => reject(xhr.statusText);

          // Progress listener
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
              const percentage = (event.loaded / event.total) * 100;
              onProgress(Math.round(percentage));
            }
          };

          xhr.send(formData);
        });
      }),
    {
      onSuccess: () => {
        toast.success(commonT('File uploaded successfully'));
      },
      onError: () => {
        toast.error(commonT('File upload failed'));
      },
    },
  );

  return { uploadFileMutation };
}
