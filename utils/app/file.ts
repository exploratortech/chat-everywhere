import {
  MAX_FILE_SIZE_FOR_UPLOAD,
  MAX_IMAGE_SIZE_FOR_UPLOAD,
  MAX_PDF_SIZE_FOR_UPLOAD,
  MAX_VIDEO_DURATION,
} from './const';

export const isFileSizeValid = (
  file: File,
): { valid: boolean; maxSize: number } => {
  const maxSize = getMaxFileSize(file.type);
  if (file.size > maxSize) {
    return {
      valid: false,
      maxSize,
    };
  }
  return {
    valid: true,
    maxSize,
  };
};

export const isMediaDurationValid = async (
  file: File,
): Promise<{ valid: boolean; duration: number }> => {
  const duration = await getMediaDuration(file);
  if (file.type.startsWith('video/') && duration > MAX_VIDEO_DURATION) {
    return {
      valid: false,
      duration,
    };
  }
  return {
    valid: true,
    duration,
  };
};

export function getMaxFileSize(fileMimeType: string): number {
  if (fileMimeType.startsWith('image/')) {
    return MAX_IMAGE_SIZE_FOR_UPLOAD;
  } else if (fileMimeType === 'application/pdf') {
    return MAX_PDF_SIZE_FOR_UPLOAD;
  } else {
    return MAX_FILE_SIZE_FOR_UPLOAD; // Default to 100 MB for other file types
  }
}

async function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const element = file.type.startsWith('video/')
      ? document.createElement('video')
      : document.createElement('audio');

    element.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(element.duration);
    };

    element.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };

    element.src = url;
  });
}
