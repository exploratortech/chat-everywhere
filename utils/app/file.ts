import {
  MAX_FILE_SIZE_FOR_UPLOAD,
  MAX_IMAGE_SIZE_FOR_UPLOAD,
  MAX_PDF_PAGES,
  MAX_PDF_SIZE_FOR_UPLOAD,
  MAX_VIDEO_DURATION,
} from './const';

import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.mjs';

const isFileSizeValid = (
  file: File,
): { valid: boolean; maxSize: number; pageCount?: number } => {
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

const isMediaDurationValid = async (
  file: File,
): Promise<{ valid: boolean; duration: number; maxDuration: number }> => {
  const duration = await getMediaDuration(file);
  if (duration > MAX_VIDEO_DURATION) {
    return {
      valid: false,
      duration,
      maxDuration: MAX_VIDEO_DURATION,
    };
  }
  return {
    valid: true,
    duration,
    maxDuration: MAX_VIDEO_DURATION,
  };
};

async function getPDFPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(new Uint8Array(arrayBuffer)).promise;
    console.log('pdf', pdf);
    return pdf.numPages;
  } catch (error) {
    console.error('Error getting PDF page count:', error);
    throw error;
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

export function getMaxFileSize(fileMimeType: string): number {
  if (fileMimeType.startsWith('image/')) {
    return MAX_IMAGE_SIZE_FOR_UPLOAD;
  } else if (fileMimeType === 'application/pdf') {
    return MAX_PDF_SIZE_FOR_UPLOAD;
  } else {
    return MAX_FILE_SIZE_FOR_UPLOAD; // Default to 100 MB for other file types
  }
}
export async function validateFile(file: File): Promise<{
  valid: boolean;
  maxSize: number;
  actualSize: number;
  duration?: number;
  maxDuration?: number;
  pageCount?: number;
  errorType?: 'size' | 'duration' | 'pageCount';
}> {
  const sizeValidation = isFileSizeValid(file);
  if (!sizeValidation.valid) {
    return {
      ...sizeValidation,
      actualSize: file.size,
      errorType: 'size',
    };
  }

  let duration: number | undefined;
  let maxDuration: number | undefined;
  let pageCount: number | undefined;

  if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
    const durationValidation = await isMediaDurationValid(file);
    if (!durationValidation.valid) {
      return {
        ...sizeValidation,
        valid: false,
        actualSize: file.size,
        duration: durationValidation.duration,
        maxDuration: durationValidation.maxDuration,
        errorType: 'duration',
      };
    }
    duration = durationValidation.duration;
    maxDuration = durationValidation.maxDuration;
  } else if (file.type === 'application/pdf') {
    try {
      pageCount = await getPDFPageCount(file);

      if (pageCount > MAX_PDF_PAGES) {
        return {
          ...sizeValidation,
          actualSize: file.size,
          valid: false,
          pageCount,
          errorType: 'pageCount',
        };
      }
    } catch (error) {
      console.error('Error getting PDF page count:', error);
    }
  }

  return {
    ...sizeValidation,
    duration,
    maxDuration,
    pageCount,
    actualSize: file.size,
  };
}
