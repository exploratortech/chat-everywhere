import { useCallback, useContext, useMemo, useState } from 'react';

import HomeContext from '@/components/home/home.context';

import { useFetchFileList } from '../file/useFetchFileList';

export const useFileList = () => {
  const [showFileList, setShowFileList] = useState(false);
  const [fileInputValue, setFileInputValue] = useState('');
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  const { data: files } = useFetchFileList();
  const {
    state: { user },
  } = useContext(HomeContext);
  const filteredFiles = useMemo(() => {
    if (!user) return [];
    return (files || []).filter((file) =>
      file.filename.toLowerCase().includes(fileInputValue.toLowerCase()),
    );
  }, [user, files, fileInputValue]);

  const updateFileListVisibility = useCallback(
    (text: string) => {
      const match = text.match(/@\w*$/);
      if (match) {
        const searchText = match[0].slice(1).toLowerCase();
        const isFilePresent =
          files?.some((file) =>
            file.filename.toLowerCase().includes(searchText),
          ) ?? false;
        setShowFileList(isFilePresent);
        setFileInputValue(searchText);
      } else {
        setShowFileList(false);
        setFileInputValue('');
      }
    },
    [files],
  );

  return {
    showFileList,
    setShowFileList,
    activeFileIndex,
    setActiveFileIndex,
    filteredFiles,
    updateFileListVisibility,
  };
};
