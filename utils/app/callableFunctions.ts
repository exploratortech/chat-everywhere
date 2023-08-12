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
    name: 'listFiles',
    description: 'Lists the names of the stored files. It returns an array of filenames.',
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

const listFiles = (args: { userToken?: string }): string => {
  const { userToken } = args;
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
