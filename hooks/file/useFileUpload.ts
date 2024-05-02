import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useContext, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import HomeContext from '@/components/home/home.context';

import useHomeLoadingBar from '../useHomeLoadingBar';

export function useFileUpload() {
  const supabase = useSupabaseClient();
  const { t: commonT } = useTranslation('common');
  const queryClient = useQueryClient();
  const {
    state: { user },
  } = useContext(HomeContext);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const { withLoading } = useHomeLoadingBar();

  const uploadFileMutation = useMutation(
    async ({ filename, file }: { filename: string; file: File }) =>
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
        const { url, headers } = await result.json();

        return new Promise((resolve, reject) => {
          const formData = new FormData();

          formData.append('file', file);

          const xhr = new XMLHttpRequest();
          xhr.open('PUT', url);
          for (const [key, value] of Object.entries(headers)) {
            if (key === 'host') continue;
            xhr.setRequestHeader(`${key}`, value as string);
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
            if (event.lengthComputable) {
              const percentage = (event.loaded / event.total) * 100;
              setUploadProgress(Math.round(percentage));
            }
          };

          xhr.onloadend = () => {
            setUploadProgress(null);
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
      onSettled: () => {
        queryClient.invalidateQueries(['gcp-files', user?.id]);
      },
    },
  );

  return { uploadFileMutation, uploadProgress };
}
