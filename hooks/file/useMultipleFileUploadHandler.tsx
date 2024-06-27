import { IconX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useFileUpload } from '@/hooks/file/useFileUpload';

export function useMultipleFileUploadHandler() {
  const { t } = useTranslation('model');
  const uploadFileMutation = useFileUpload();
  const {
    uploadFileMutation: { mutateAsync: uploadFile, isLoading },
  } = uploadFileMutation;

  // New state to track progress for each file
  const [fileProgresses, setFileProgresses] = useState<
    Record<
      string,
      {
        progress: number;
        isSuccessUpload: boolean | null;
        toastId: string | null;
      }
    >
  >({});

  useEffect(() => {
    Object.entries(fileProgresses).forEach(([fileName, file]) => {
      if (file.isSuccessUpload === null) {
        if (!file.toastId) {
          const id = toast.loading(
            `${t('Uploading')}: ${fileName} - ${file.progress}%`,
            { duration: Infinity, position: 'bottom-right' },
          );
          setFileProgresses((prev) => ({
            ...prev,
            [fileName]: { ...file, toastId: id },
          }));
        } else {
          toast.loading(`${t('Uploading')}: ${fileName} - ${file.progress}%`, {
            id: file.toastId,
            position: 'bottom-right',
          });
        }
      } else {
        if (file.toastId) {
          toast.dismiss(file.toastId);
          if (file.isSuccessUpload) {
            toast.success(`${t('Uploaded successfully')}: ${fileName}`, {
              position: 'bottom-right',
            });
          } else {
            // Update the toast creation
            const errorToastId = toast.custom(
              () => (
                <CustomErrorToast
                  message={`${t('Upload failed')}: ${fileName}`}
                  close={() => toast.dismiss(errorToastId)}
                />
              ),
              {
                position: 'bottom-right',
                duration: Infinity,
              },
            );
            setFileProgresses((prev) => ({
              ...prev,
              [fileName]: { ...file, toastId: errorToastId },
            }));
          }
          setFileProgresses((prev) => ({
            ...prev,
            [fileName]: { ...file, toastId: null },
          }));
        }
      }
    });
  }, [fileProgresses, t]);

  const dismissAllErrorToasts = () => {
    Object.entries(fileProgresses).forEach(([fileName, file]) => {
      if (file.isSuccessUpload === false && file.toastId) {
        toast.dismiss(file.toastId);
        setFileProgresses((prev) => ({
          ...prev,
          [fileName]: { ...prev[fileName], toastId: null },
        }));
      }
    });
  };

  const uploadFiles = async (
    files: File[],
    onCompleteFileUpload?: () => void,
  ) => {
    if (files.length === 0) {
      alert(t('No files selected.'));
      return;
    }

    // Dismiss all error toasts when starting a new upload
    dismissAllErrorToasts();

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

    filterFailedUploads();
  };

  const filterFailedUploads = () => {
    setFileProgresses((prev) => {
      const filteredProgresses = Object.entries(prev).reduce(
        (acc, [fileName, state]) => {
          if (state.isSuccessUpload === false) {
            acc[fileName] = state;
          } else if (state.toastId) {
            // Dismiss the toast for successful uploads
            toast.dismiss(state.toastId);
          }
          return acc;
        },
        {} as Record<
          string,
          {
            progress: number;
            isSuccessUpload: boolean | null;
            toastId: string | null;
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

// Update CustomErrorToast component
const CustomErrorToast = ({
  message,
  close,
}: {
  message: string;
  close: () => void;
}) => (
  <div className="flex items-center justify-between bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
    <div>{message}</div>
    <button onClick={close} className="text-red-700 hover:text-red-900">
      <IconX size={18} />
    </button>
  </div>
);
