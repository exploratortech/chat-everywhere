import { IconCirclePlus } from '@tabler/icons-react';
import React, { useCallback, useContext } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import HomeContext from '@/pages/api/home/home.context';

interface DropZoneProps {
  onDropCallback: (file: File) => void;
}

function DropZone({ onDropCallback }: DropZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length !== 1) {
        toast.error(t('Please upload only 1 image'));
        return;
      }
      const file = acceptedFiles[0];
      if (!file) return;
      onDropCallback(file);
    },
    [onDropCallback],
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
  const { t: commonT } = useTranslation('common');
  const { t } = useTranslation('imageToPrompt');
  const {
    state: { user },
  } = useContext(HomeContext);

  return (
    <div
      className={`flex justify-between items-center p-[.4rem]  cursor-pointer w-[50%] rounded-lg border border-neutral-200 ${
        isDragActive ? 'bg-blue-500 dark:bg-blue-800 ' : 'bg-transparent'
      } text-neutral-900 dark:border-neutral-600 dark:text-white  pr-1 focus:outline-none`}
      {...getRootProps()}
      onClick={() => {
        if (!user) {
          toast.error(commonT('Please sign in to use image to prompt feature'));
          return;
        }
        document.getElementById('upload-images-to-text')?.click();
      }}
    >
      <input
        id="upload-images-to-text"
        className="sr-only hidden"
        type="file"
        accept=".jpg,.jpeg,.png,.gif"
        {...getInputProps()}
      />
      <div className={`text-gray-400 ${isDragActive ? '!text-white' : ''} `}>
        {commonT('Upload')}
      </div>
      <IconCirclePlus />
    </div>
  );
}
export default DropZone;
