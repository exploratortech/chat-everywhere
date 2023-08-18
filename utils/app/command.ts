import { CommandResult } from "@/types/command";
import { PairPlatforms } from "@/types/pair";
import {
  handleHelpCommand,
  handlePairCommand,
  handleUnpairCommand,
} from "./commands";

type CommandData = {
  app?: PairPlatforms,
  appUserId?: string,
  userId?: string,
}

class MissingCommandData extends Error {
  constructor(...properties: string[]) {
    super(`Missing data: ${properties.join(', ')}`);
  }
}

export const isCommand = (input: string): boolean => {
  return !!input.match(/^\s*\/[\w?]+/i);
}

const parseCommand = (input: string): string[] => {
  let formattedCommand = input.replace(/\s+/g, ' ').trim();
  return formattedCommand.split(' ');
};

export const executeCommand = async (
  input: string,
  data: CommandData,
): Promise<CommandResult> => {
  try {
    const [command, ...args] = parseCommand(input);
    switch (command) {
      case '/?':
      case '/help': return await handleHelpCommand();
      case '/pair': {
        const { app, appUserId } = data;
        if (!app || !appUserId) {
          throw new MissingCommandData('app', 'appUserId');
        }
        return await handlePairCommand(args, { app, appUserId });
      };
      case '/unpair': {
        const { app, appUserId } = data;
        if (!app || !appUserId) {
          throw new MissingCommandData('app', 'appUserId');
        }
        return await handleUnpairCommand(args, { app, appUserId });
      };
      default:
        return {
          message: `Unknown command '${command}'`,
          error: true,
        };
    }
  } catch (error) {
    console.error(error);
    return {
      message: 'Unable to complete request. Please try again later',
      error: true,
    };
  }
};
