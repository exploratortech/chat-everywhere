import { getTimeStamp } from '@/types/misc';
import { UploadedFiles } from "@/utils/app/uploadedFiles";

export const CALLABLE_FUNCTIONS = [
  {
    name: 'readFromFile',
    description: 'Read the contents of a given file.',
    parameters: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'The name of the file',
        },
      },
      required: ['filename'],
    },
  },
  {
    name: 'writeToFile',
    description: 'Create a new file or write to a specified file.',
    parameters: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'The name of the file',
        },
        content: {
          type: 'string',
          description: 'The content that\'s to be written to the file'
        },
      },
      required: ['filename', 'content'],
    },
  },
  {
    name: 'deleteFiles',
    description: 'Deletes the specified files.',
    parameters: {
      type: 'object',
      properties: {
        filenames: {
          type: 'array',
          items: { type: 'string' },
          description: 'The names of the files to be deleted',
        },
      },
      required: ['filenames'],
    },
  },
  {
    name: 'listFiles',
    description: 'Lists the names of all stored files. It returns an array of filenames.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'getTimeStamp',
    description: 'Get the current time stamp',
    parameters: {
      type: 'object',
      properties: {},
    },
  }
];

const readFromFile = (filename: string): string => {
  try {
    const content = UploadedFiles.read(filename);
    return content;
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return `readFromFile:error:${error.message}`;
    }
    return `readFromFile:error:Unable to read file`;
  }
};

const writeToFile = (filename: string, content: string): string => {
  try {
    UploadedFiles.write(filename, content);
    return content;
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return `writeToFile:error:${error.message}`;
    }
    return `writeToFile:error:Unable to write to file`;
  }
};

const deleteFiles = (filenames: string[]): string => {
  try {
    UploadedFiles.remove(filenames);
    return '';
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return `deleteFiles:error:${error.message}`;
    }
    return `deleteFiles:error:Unable to delete files`;
  }
};

const listFiles = (): string => {
  try {
    const filenames = UploadedFiles.list();
    return JSON.stringify(filenames);
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return `listFiles:error:${error.message}`;
    }
    return `listFiles:error:Unable to retrieve files`;
  }
};

export const AVAILABLE_FUNCTIONS: { [functionName: string]: Function} = {
  'readFromFile': readFromFile,
  'writeToFile': writeToFile,
  'deleteFiles': deleteFiles,
  'listFiles': listFiles,
  'getTimeStamp': getTimeStamp,
};
