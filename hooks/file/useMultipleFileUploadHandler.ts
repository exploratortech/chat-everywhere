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
    uploadProgress,
  } = uploadFileMutation;

  const uploadFiles = async (file: File | null) => {
    if (!file) {
      alert(t('No file selected.'));
      return;
    }

    const maxFileSize = 52428800; // 50 MB in bytes

    // Check file Size
    if (file.size > maxFileSize) {
      alert(t('File size exceeds the maximum limit of {{mb}} MB.', { mb: 50 }));
      return;
    }

    try {
      const uploadOk = await uploadFile({ filename: file.name, file });
      if (uploadOk && onCompleteFileUpload) {
        onCompleteFileUpload();
      }
    } catch (error) {
      console.error('Upload failed', error);
    }
  };

  return {
    isLoading,
    uploadProgress,
    uploadFiles,
  };
}
