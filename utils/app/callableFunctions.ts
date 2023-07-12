import { readFromFile, writeToFile } from "./file";

export const CALLABLE_FUNCTIONS = [
  {
    name: "readFromFile",
    description: "Read the content of a given file",
    parameters: {
      type: "object",
      properties: {
        filename: {
          type: "string",
          description: "The name of the file",
        },
      },
      required: ["filename"],
    }
  },
  {
    name: "writeToFile",
    description: "Write to a specified file",
    parameters: {
      type: "object",
      properties: {
        filename: {
          type: "string",
          description: "The name of the file",
        },
        content: {
          type: "string",
          description: "The content that's to be written to the file"
        },
      },
      required: ["filename", "content"],
    }
  }
];

export const AVAILABLE_FUNCTIONS: { [functionName: string]: Function} = {
  "readFromFile": readFromFile,
  "writeToFile": writeToFile,
};
