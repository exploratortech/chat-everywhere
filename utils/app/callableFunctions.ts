import { getTimeStamp } from '@/types/misc';
import { deleteFiles, listFiles, readFromFile, writeToFile } from './file';

export const CALLABLE_FUNCTIONS = [
  {
    name: 'readFromFile',
    description: 'Read the content of a given file.',
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
    description: 'Write to a specified file.',
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

export const AVAILABLE_FUNCTIONS: { [functionName: string]: Function} = {
  'readFromFile': readFromFile,
  'writeToFile': writeToFile,
  'deleteFiles': deleteFiles,
  'listFiles': listFiles,
  'getTimeStamp': getTimeStamp,
};
