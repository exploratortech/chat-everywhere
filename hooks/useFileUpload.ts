import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export function useFileUpload() {
  const supabase = useSupabaseClient();
  const { t: commonT } = useTranslation('common');
  const queryClient = useQueryClient();

  const uploadFileMutation = useMutation(
    async ({ filename, file }: { filename: string; file: File }) => {
      const accessToken = (await supabase.auth.getSession()).data.session
        ?.access_token!;
      const result = await fetch(`/api/files/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access-token': accessToken,
        },
        body: JSON.stringify({ fileName: filename }),
      });
      const { url, fields } = await result.json();
      const formData = new FormData();
      Object.entries({ ...fields, file }).forEach(([key, value]) => {
        formData.append(key, value as string | Blob);
      });
      const upload = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      return upload.ok;
    },
    {
      onSuccess: () => {
        toast.success(commonT('File uploaded successfully'));
      },
      onError: () => {
        toast.error(commonT('File upload failed'));
      },
      onSettled: () => {
        // queryClient.invalidateQueries([queryKey]);
      },
    },
  );

  return uploadFileMutation;
}
