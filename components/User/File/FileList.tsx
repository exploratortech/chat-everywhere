import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useQuery } from '@tanstack/react-query';
import React, { useContext, useEffect, useState } from 'react';

import HomeContext from '@/components/home/home.context';

import { File } from '@google-cloud/storage';

const FileList = () => {
  const { data: userFiles, isFetching } = useFetchFileList();
  return (
    <div>
      FileList
      {userFiles &&
        userFiles.map((file) => <div key={file.name}>{file.name}</div>)}
    </div>
  );
};

export default FileList;

const useFetchFileList = () => {
  const supabase = useSupabaseClient();
  const {
    state: { user },
  } = useContext(HomeContext);
  const fetchFileList = async () => {
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
    return data.files as File[];
  };

  return useQuery(['files', user?.id], fetchFileList, {
    keepPreviousData: true,
    onError: (error) => {
      console.error('There was a problem with your fetch operation:', error);
    },
  });
};
