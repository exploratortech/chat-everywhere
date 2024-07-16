import type { UserFile } from '@/types/UserFile';

import { MAX_FILE_DROP_COUNT } from './const';
import { validateFile } from './file';

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

export const validateAndUploadFiles = async (
  files: FileList | null,
  uploadFiles: (
    files: File[],
    onCompleteFileUpload?: (newFile: UserFile[]) => void,
  ) => Promise<void>,
  onComplete: (newFile: UserFile[]) => void,
  t: (key: string, options?: any) => string,
) => {
  if (files) {
    if (files.length === 0) {
      alert(
        t(
          'No valid files were selected. Please upload only supported file types.',
        ),
      );
      return;
    }
    if (files.length > MAX_FILE_DROP_COUNT) {
      alert(
        t('You can only upload a maximum of {{count}} files at once.', {
          count: MAX_FILE_DROP_COUNT,
        }),
      );
      return;
    }

    //  check the file types
    const invalidFiles = Array.from(files).filter(
      (file) => !isFileTypeAllowed(file),
    );
    if (invalidFiles.length > 0) {
      const invalidFileNames = invalidFiles.map((file) => file.name).join(', ');
      alert(
        t('The following files are not supported: {{fileNames}}', {
          fileNames: invalidFileNames,
        }),
      );
      return;
    }

    // Check file size, duration, and page count
    for (const file of Array.from(files)) {
      const validation = await validateFile(file);
      if (!validation.valid) {
        let errorMessage = '';
        switch (validation.errorType) {
          case 'size':
            errorMessage = t(
              'File {{name}} size ({{actualSize}} MB) exceeds the maximum limit of {{maxSize}} MB for file type {{type}}.',
              {
                name: file.name,
                actualSize: (validation.actualSize / 1024 / 1024).toFixed(2),
                maxSize: (validation.maxSize / 1024 / 1024).toFixed(2),
                type: file.type,
              },
            );
            break;
          case 'duration':
            errorMessage = t(
              'File {{name}} duration ({{actualDuration}} seconds) exceeds the maximum limit of {{maxDuration}} seconds for file type {{type}}.',
              {
                name: file.name,
                actualDuration: validation.duration?.toFixed(2),
                maxDuration: validation.maxDuration?.toFixed(2),
                type: file.type,
              },
            );
            break;
          case 'pageCount':
            errorMessage = t(
              'File {{name}} page count ({{pageCount}} pages) exceeds the maximum limit for PDF files.',
              {
                name: file.name,
                pageCount: validation.pageCount,
              },
            );
            break;
          default:
            errorMessage = t('File {{name}} failed validation.', {
              name: file.name,
            });
        }
        alert(errorMessage);
        return;
      }
    }

    await uploadFiles(Array.from(files), onComplete);
  }
};
