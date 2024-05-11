import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useContext } from 'react';
import toast from 'react-hot-toast';

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
    return response.json();
  };

  const { withLoading } = useHomeLoadingBar();
  return useMutation(
    async (objectPath: string) => withLoading(() => downloadFile(objectPath)),
    {
      onMutate: () => {
        const toastId = toast.loading('Downloading...');
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
        toast.error('Download failed!');
      },
      onSettled: (data, error, variables, context) => {
        toast.dismiss(context?.toastId);
        queryClient.invalidateQueries(['gcp-files', user?.id]);
      },
    },
  );
};
