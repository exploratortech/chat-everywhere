import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useFileUpload } from '@/hooks/file/useFileUpload';

import { MAX_FILE_SIZE_FOR_UPLOAD } from '@/utils/app/const';

import CustomUploadToast from '@/components/Files/CustomUploadToast';

type FileUploadStatuses = Record<
  string,
  {
    progress: number;
    isSuccessUpload: boolean | null;
    toastId: string | undefined;
  }
>;
export function useMultipleFileUploadHandler() {
  const { t } = useTranslation('model');
  const uploadFileMutation = useFileUpload();
  const {
    uploadFileMutation: { mutateAsync: uploadFile, isLoading },
  } = uploadFileMutation;

  const failedUploadsToastIds = useRef<string[]>([]);

  const [fileProgresses, setFileProgresses] = useState<FileUploadStatuses>({});

  const handleFileUploading = useCallback(
    (
      fileName: string,
      file: any,
      toastContent: JSX.Element,
      toastProps: any,
    ) => {
      if (!file.toastId) {
        const id = toast.custom(toastContent, {
          ...toastProps,
          duration: Infinity,
        });
        updateFileProgress(fileName, { ...file, toastId: id });
      } else {
        toast.loading(toastContent, toastProps);
      }
    },
    [],
  );

  const handleFileUploaded = useCallback(
    (fileName: string, file: any, toastProps: any) => {
      if (file.toastId) {
        toast.dismiss(file.toastId);
        const toastMessage = file.isSuccessUpload
          ? `${t('Uploaded successfully')}: ${fileName}`
          : `${t('Upload failed')}: ${fileName}`;

        const toastType = file.isSuccessUpload ? toast.success : toast.error;

        const newToastId = toastType(toastMessage, {
          ...toastProps,
          duration: file.isSuccessUpload ? undefined : Infinity,
          className: file.isSuccessUpload
            ? undefined
            : 'toast-with-close-button',
        });

        removeFileFromProgresses(fileName);

        if (!file.isSuccessUpload) {
          failedUploadsToastIds.current.push(newToastId);
        }
      }
    },
    [t],
  );

  const handleFileProgress = useCallback(
    (fileName: string, file: any) => {
      const { isSuccessUpload, toastId, progress } = file;

      const toastProps = {
        position: 'bottom-right',
        id: toastId,
      } as const;

      const toastContent = (
        <CustomUploadToast
          fileName={fileName}
          progress={progress}
          isSuccessUpload={isSuccessUpload}
        />
      );

      if (isSuccessUpload === null) {
        handleFileUploading(fileName, file, toastContent, toastProps);
      } else {
        handleFileUploaded(fileName, file, toastProps);
      }
    },
    [handleFileUploaded, handleFileUploading],
  );

  useEffect(() => {
    Object.entries(fileProgresses).forEach(([fileName, file]) => {
      handleFileProgress(fileName, file);
    });
  }, [fileProgresses, handleFileProgress, t]);

  const removeFileFromProgresses = (fileName: string) => {
    setFileProgresses((prev) => {
      const newFileProgresses = { ...prev };
      delete newFileProgresses[fileName];
      return newFileProgresses;
    });
  };

  const updateFileProgress = (
    fileName: string,
    newFileState: FileUploadStatuses[string],
  ) => {
    setFileProgresses((prev) => ({
      ...prev,
      [fileName]: newFileState,
    }));
  };

  const dismissAllErrorToasts = () => {
    failedUploadsToastIds.current.forEach((toastId) => {
      toast.dismiss(toastId);
    });
    failedUploadsToastIds.current = [];
  };

  const uploadFiles = async (
    files: File[],
    onCompleteFileUpload?: () => void,
  ) => {
    if (files.length === 0) {
      alert(t('No files selected.'));
      return;
    }

    dismissAllErrorToasts();

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_FOR_UPLOAD) {
        alert(
          t('File {{name}} size exceeds the maximum limit of {{mb}} MB.', {
            name: file.name,
            mb: 50,
          }),
        );
        break;
      }
    }

    setFileProgresses(() => {
      return files.reduce((acc, file) => {
        return {
          ...acc,
          [file.name]: { progress: 0, isSuccessUpload: null, toastId: null },
        };
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
              [file.name]: {
                ...prev[file.name],
                progress,
                isSuccessUpload: null,
              },
            }));
          },
        });
        if (uploadOk) {
          setFileProgresses((prev) => ({
            ...prev,
            [file.name]: {
              ...prev[file.name],
              progress: 100,
              isSuccessUpload: true,
            },
          }));
        }
      } catch (error) {
        console.error(`Upload failed for ${file.name}`, error);
        setFileProgresses((prev) => ({
          ...prev,
          [file.name]: { ...prev[file.name], isSuccessUpload: false },
        }));
      }
    }

    if (onCompleteFileUpload) {
      onCompleteFileUpload();
    }

    removeSuccessUploads();
  };

  const removeSuccessUploads = () => {
    setFileProgresses((prev) => {
      const filteredProgresses = Object.entries(prev).reduce(
        (acc, [fileName, state]) => {
          if (state.isSuccessUpload === false) {
            acc[fileName] = state;
          } else if (state.toastId) {
            toast.dismiss(state.toastId);
          }
          return acc;
        },
        {} as Record<
          string,
          {
            progress: number;
            isSuccessUpload: boolean | null;
            toastId: string | undefined;
          }
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
