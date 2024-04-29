import React from 'react';

import { useFetchFileList } from '@/hooks/useFetchFileList';

const FileList = () => {
  const { data: userFiles } = useFetchFileList();
  return (
    <div>
      FileList
      {userFiles &&
        userFiles.map((file, index) => (
          <div key={`${file.id}-${index}`}>{file.filename}</div>
        ))}
    </div>
  );
};

export default FileList;
