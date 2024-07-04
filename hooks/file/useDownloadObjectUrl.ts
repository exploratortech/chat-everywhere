import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useContext } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import HomeContext from '@/components/home/home.context';

import useHomeLoadingBar from '../useHomeLoadingBar';

export const useDownloadObjectUrl = () => {
  const {
    state: { user },
  } = useContext(HomeContext);

  const supabase = useSupabaseClient();

  const queryClient = useQueryClient();

  const downloadFile = async (objectPath: string) => {
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token!;
    const response = await fetch('/api/files/get-object-download-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
      },
      body: JSON.stringify({ objectPath }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get download URL');
    }
    return await response.json();
  };

  const { withLoading } = useHomeLoadingBar();
  const { t } = useTranslation('model');
  return useMutation(
    async (objectPath: string) => withLoading(() => downloadFile(objectPath)),
    {
      onMutate: () => {
        const toastId = toast.loading(t('Downloading...'));
        return { toastId };
      },
      onError: (error: Error, variables, context) => {
        console.log({
          error,
          variables,
          context,
        });
        console.error('Error getting download URL:', error.message);
        toast.dismiss(context?.toastId);
        toast.error(t('Download failed!'));
      },
      onSettled: (context) => {
        toast.dismiss(context?.toastId);
        queryClient.cancelQueries(['gcp-files', user?.id]).then(() => {
          queryClient.invalidateQueries(['gcp-files', user?.id]);
        });
      },
    },
  );
};
