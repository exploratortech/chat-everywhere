import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useQuery } from '@tanstack/react-query';
import React, { useContext } from 'react';

import { useFetchFileList } from '@/hooks/useFetchFileList';

import { StorageObject } from '@/types/google-storage';

import HomeContext from '@/components/home/home.context';

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
