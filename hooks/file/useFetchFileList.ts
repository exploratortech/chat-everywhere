import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useQuery } from '@tanstack/react-query';
import { useContext } from 'react';

import { UserFile } from '@/types/UserFile';

import HomeContext from '@/components/home/home.context';

import useHomeLoadingBar from '../useHomeLoadingBar';

export const useFetchFileList = () => {
  const supabase = useSupabaseClient();
  const { withLoading } = useHomeLoadingBar();
  const {
    state: { user },
  } = useContext(HomeContext);
  const fetchFileList = async () => {
    if (!user) {
      return [];
    }
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token!;
    const response = await fetch('/api/files/file-list-by-user', {
      headers: {
        'access-token': accessToken,
      },
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data.files as UserFile[];
  };

  return useQuery(['gcp-files', user?.id], () => withLoading(fetchFileList), {
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    onError: (error) => {
      console.error('There was a problem with your fetch operation:', error);
    },
  });
};
