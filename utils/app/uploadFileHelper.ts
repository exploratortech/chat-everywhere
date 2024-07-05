import { UserFile } from '@/types/UserFile';

import { MAX_FILE_DROP_COUNT } from './const';

export const allowedTypes = [
  'application/pdf',
  'text/plain',
  'audio/aac',
  'audio/flac',
  'audio/mp3',
  'audio/m4a',
  'audio/mpeg',
  'audio/mpga',
  'audio/mp4',
  'audio/opus',
  'audio/pcm',
  'audio/wav',
  'audio/webm',
  'image/png',
  'image/jpeg',
  'video/quicktime',
  'video/mp4',
  'video/mpeg',
  'video/webm',
];

export const isFileTypeAllowed = (file: File) => {
  const fileType = file.type.toLowerCase();

  // Check exact match
  if (allowedTypes.includes(fileType)) return true;

  // Check for general type match (e.g., "audio/*")
  const generalType = fileType.split('/')[0];
  if (allowedTypes.includes(`${generalType}/*`)) return true;

  // Check for specific type variations
  if (fileType.startsWith('audio/')) {
    const audioExtensions = [
      'mp3',
      'mpeg',
      'mpga',
      'mp4',
      'm4a',
      'wav',
      'webm',
    ];
    return audioExtensions.some((ext) => fileType.includes(ext));
  }

  if (fileType.startsWith('image/')) {
    return ['png', 'jpeg', 'jpg'].some((ext) => fileType.includes(ext));
  }

  // Add check for video types
  if (fileType.startsWith('video/')) {
    const videoExtensions = ['quicktime', 'mp4', 'mpeg', 'webm'];
    return videoExtensions.some((ext) => fileType.includes(ext));
  }

  return false;
};

export const createFileList = (files: File[]): FileList => {
  const dataTransfer = new DataTransfer();
  files.forEach((file) => dataTransfer.items.add(file));
  return dataTransfer.files;
};

export const handleFileUpload = (
  files: FileList | null,
  uploadFiles: (
    files: File[],
    onCompleteFileUpload?: (newFile: UserFile[]) => void,
  ) => Promise<void>,
  onComplete: (newFile: UserFile[]) => void,
  t: (key: string, options?: any) => string,
) => {
  if (files) {
    const validFiles = Array.from(files).filter(isFileTypeAllowed);

    if (validFiles.length > 0 && validFiles.length <= MAX_FILE_DROP_COUNT) {
      uploadFiles(validFiles, onComplete);
    } else if (validFiles.length === 0) {
      alert(
        t(
          'No valid files were selected. Please upload only supported file types.',
        ),
      );
    } else {
      alert(
        t('You can only upload a maximum of {{count}} files at once.', {
          count: MAX_FILE_DROP_COUNT,
        }),
      );
    }
  }
};
