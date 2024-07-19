import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useContext } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import type { UserFile } from '@/types/UserFile';

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
  const { t } = useTranslation('model');
  return useMutation(
    async (objectPath: string) => withLoading(() => deleteFile(objectPath)),
    {
      onMutate: async (objectPath: string) => {
        await queryClient.cancelQueries(['gcp-files', user?.id]);

        const previousFiles = queryClient.getQueryData(['gcp-files', user?.id]);

        queryClient.setQueryData(
          ['gcp-files', user?.id],
          (old: UserFile[] | undefined) => {
            if (old) {
              return old.filter((file: any) => file.objectPath !== objectPath);
            } else {
              return old;
            }
          },
        );

        return { previousFiles };
      },
      onError: (error: Error, objectPath: string, context) => {
        toast.error(t('Error deleting file'));
        console.error('Error deleting file:', error.message);
        if (context) {
          queryClient.setQueryData(
            ['gcp-files', user?.id],
            context.previousFiles,
          );
        }
      },
      onSettled: () => {
        queryClient.cancelQueries(['gcp-files', user?.id]).then(() => {
          queryClient.invalidateQueries(['gcp-files', user?.id]);
        });
      },
    },
  );
};
