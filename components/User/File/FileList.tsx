import React, { useEffect, useState } from 'react';

import { File } from '@google-cloud/storage';

const FileList = () => {
  const [userFiles, setUserFiles] = useState<File[]>([]);
  useEffect(() => {
    const fetchFileList = async () => {
      try {
        const response = await fetch('/api/files/file-list-by-user');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log(data.files);
        setUserFiles(data.files);
      } catch (error) {
        console.error('There was a problem with your fetch operation:', error);
      }
    };

    fetchFileList();
  }, []);
  return (
    <div>
      FileList
      {userFiles.map((file) => (
        <div key={file.name}>{file.name}</div>
      ))}
    </div>
  );
};

export default FileList;
