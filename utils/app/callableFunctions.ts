import { getTimeStamp } from '@/types/misc';
import { UploadedFiles } from "@/utils/app/uploadedFiles";

export const CALLABLE_FUNCTIONS = [
  {
    name: 'readFromFile',
    description: 'Reads a given file and returns a JSON object with a single property called \'content\' containing the file\'s content.',
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
          description: 'The name of the file.',
        },
        content: {
          type: 'string',
          description: 'The content that is written to the file.'
        },
      },
      required: ['filename', 'content'],
    },
  },
  {
    name: 'deleteFiles',
    description: 'Forcibly deletes all or specified files.',
    parameters: {
      type: 'object',
      properties: {
        filenames: {
          type: 'string',
          description: 'A comma-separated string of filenames. Pass an asterisk (*) to delete all files.',
        },
      },
      required: ['filenames'],
    },
  },
  {
    name: 'renameFile',
    description: 'Renames a file to a given name.',
    parameters: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'Name of the file to change.',
        },
        newName: {
          type: 'string',
          description: 'New name of the file.',
        },
      },
      required: ['filename', 'newName'],
    },
  },
  {
    name: 'searchFiles',
    description: 'Returns an array of the first 25 filenames that match a given query in ascending alphabetical order.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'A search query. Can be blank.',
        },
      },
      required: ['query'],
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

const readFromFile = async (args: { filename: string, userToken?: string }): Promise<string> => {
  const { filename, userToken } = args;
  try {
    const content = await UploadedFiles.read(filename, userToken);

    // Returns the content as a JSON object because there are cases where GPT
    // will respond with an error depending on the content of the file. (i.e. a
    // file containing the single word 'bye')
    return JSON.stringify({ content });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      console.error(error.stack);
      return `readFromFile:error:${error.message}`;
    }
    return `readFromFile:error:Unable to read file`;
  }
};

const writeToFile = async (args: { filename: string, content: string, userToken?: string }): Promise<string> => {
  const { filename, content, userToken } = args;
  try {
    await UploadedFiles.write(filename, content, userToken);
    return content;
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return `writeToFile:error:${error.message}`;
    }
    return `writeToFile:error:Unable to write to file`;
  }
};

const deleteFiles = async (args: { filenames: string, userToken?: string }): Promise<string> => {
  const { filenames, userToken } = args;
  try {
    await UploadedFiles.remove(filenames, userToken);
    return '';
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return `deleteFiles:error:${error.message}`;
    }
    return `deleteFiles:error:Unable to delete files`;
  }
};

const renameFile = async (args: { filename: string, newName: string, userToken?: string }): Promise<string> => {
  const { filename, newName, userToken } = args;
  try {
    await UploadedFiles.rename(filename, newName, userToken);
    return newName;
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return `renameFile:error:${error.message}`;
    }
    return `renameFile:error:Unable to rename file`;
  }
};

const searchFiles = async (args: { query?: string, userToken?: string }): Promise<string> => {
  const { query, userToken } = args;
  try {
    const { files } = await UploadedFiles.load(userToken, null, query);
    return JSON.stringify(files.map((file) => file.name));
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return `searchFiles:error:${error.message}`;
    }
    return `searchFiles:error:Unable to retrieve files`;
  }
};

export const AVAILABLE_FUNCTIONS: { [functionName: string]: Function} = {
  'readFromFile': readFromFile,
  'writeToFile': writeToFile,
  'deleteFiles': deleteFiles,
  'renameFile': renameFile,
  'searchFiles': searchFiles,
  'getTimeStamp': getTimeStamp,
};
