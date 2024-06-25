import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useFileUpload } from '@/hooks/file/useFileUpload';

export function useMultipleFileUploadHandler({
  onCompleteFileUpload,
}: {
  onCompleteFileUpload?: () => void;
}) {
  const { t } = useTranslation('model');
  const uploadFileMutation = useFileUpload();
  const {
    uploadFileMutation: { mutateAsync: uploadFile, isLoading },
  } = uploadFileMutation;

  // New state to track progress for each file
  const [fileProgresses, setFileProgresses] = useState<
    Record<string, { progress: number; isSuccessUpload: boolean | null }>
  >({});

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) {
      alert(t('No files selected.'));
      return;
    }

    const maxFileSize = 52428800; // 50 MB in bytes
    for (const file of files) {
      if (file.size > maxFileSize) {
        alert(
          t('File {{name}} size exceeds the maximum limit of {{mb}} MB.', {
            name: file.name,
            mb: 50,
          }),
        );
      }
    }

    setFileProgresses(() => {
      return files.reduce((acc, file) => {
        return { ...acc, [file.name]: { progress: 0, isSuccessUpload: null } };
      }, {});
    });

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      try {
        const uploadOk = await uploadFile({
          filename: file.name,
          file,
          onProgress: (progress: number) => {
            setFileProgresses((prev) => ({
              ...prev,
              [file.name]: { progress, isSuccessUpload: null },
            }));
          },
        });
        if (uploadOk) {
          setFileProgresses((prev) => ({
            ...prev,
            [file.name]: { progress: 100, isSuccessUpload: true },
          }));
        }
      } catch (error) {
        console.error(`Upload failed for ${file.name}`, error);
        toast.error(t(`Upload failed for {{name}}`, { name: file.name }));
        setFileProgresses((prev) => ({
          ...prev,
          [file.name]: { ...prev[file.name], isSuccessUpload: false },
        }));
      }
    }

    if (onCompleteFileUpload) {
      onCompleteFileUpload();
    }

    filterFailedUploads();
  };

  const filterFailedUploads = () => {
    setFileProgresses((prev) => {
      const filteredProgresses = Object.entries(prev).reduce(
        (
          acc: Record<
            string,
            { progress: number; isSuccessUpload: boolean | null }
          >,
          [fileName, state],
        ) => {
          if (state.isSuccessUpload === false) {
            acc[fileName] = state;
          }
          return acc;
        },
        {} as Record<
          string,
          { progress: number; isSuccessUpload: boolean | null }
        >,
      );
      return filteredProgresses;
    });
  };

  return {
    isLoading,
    fileProgresses,
    uploadFiles,
  };
}
