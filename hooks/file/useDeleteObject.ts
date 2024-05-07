import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useContext } from 'react';

import HomeContext from '@/components/home/home.context';

import useHomeLoadingBar from '../useHomeLoadingBar';

export const useDeleteObject = () => {
  const {
    state: { user },
  } = useContext(HomeContext);

  const supabase = useSupabaseClient();

  const queryClient = useQueryClient();

  const deleteFile = async (objectPath: string) => {
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token!;
    const response = await fetch('/api/files/delete-a-object', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
      },
      body: JSON.stringify({ objectPath }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete the file');
    }

    return response.json();
  };

  const { withLoading } = useHomeLoadingBar();
  return useMutation(
    async (objectPath: string) => withLoading(() => deleteFile(objectPath)),
    {
      onError: (error: Error) => {
        console.error('Error deleting file:', error.message);
      },

      onSettled: () => {
        queryClient.invalidateQueries(['gcp-files', user?.id]);
      },
      onSuccess: () => {
        console.log('File deleted successfully');
      },
    },
  );
};
