import { CommandResult } from "@/types/command";
import {
  assignPairCode,
  getInstantMessageAppUser,
  getPairCodeCoolDown,
  isPaired,
  pair,
  unpair,
  validatePairCode,
} from "../server/pairing";
import { getUserIdByEmail } from "../server/supabase";
import { isEmailValid } from "./validation";
import { PairPlatforms } from "@/types/pair";

type CommandData = {
  app?: PairPlatforms,
  appUserId?: string,
  userId?: string,
}

export function isCommand(input: string): boolean {
  return !!input.match(/^\s*\/[\w?]+/i);
};

function parseCommand(input: string): string[] {
  let formattedCommand = input.replace(/\s+/g, ' ').trim();
  return formattedCommand.split(' ');
};

export async function executeCommand(
  input: string,
  data: CommandData,
): Promise<CommandResult> {
  const [command, ...args] = parseCommand(input);

  try {
    switch (command) {
      case '/?':
      case '/help': return await handleHelpCommand();
      case '/pair': return await handlePairCommand(args, data);
      case '/unpair': return await handleUnpairCommand(args, data);
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

export const handleHelpCommand = async (): Promise<CommandResult> => {
  return {
    message: [
    'Here is a list of the available commands:',
    '\n1. /help or /? - Displays this help message',
    '\n2. /pair [email] [code] - Connect to your Chat Everywhere account',
    '\n3. /unpair - Unpair from your Chat Everywhere account',
    ].join(''),
  };
};

export const handlePairCommand = async (args: string[], data: CommandData): Promise<CommandResult> => {
  const [email, pairCode] = args;

  if (args.length === 0) {
    const { app, appUserId } = data;
    if (!app || !appUserId) {
      throw new Error('Missing \'app\' or \'appUserId\'');
    }

    if (await isPaired(appUserId, app)) {
      return { message: 'Your account is paired.' };
    } else {
      return { message: 'Your account isn\'t paired. Use "/pair <email>" to get started.' };
    }
  } else if (args.length === 1) {
    if (!email || !isEmailValid(email)) {
      return {
        message: 'Invalid email',
        error: true,
      };
    }

    // Return a success message to prevent malicious users from figuring out
    // if an email is registered on our platform
    const userId = await getUserIdByEmail(email);
    if (!userId) {
      return { message: 'Success! A pairing code has been generated for you. Please go into your settings in the Chat Everywhere app to find your code and enter it here using the command \'/pair <email> <code>\'' };
    }

    // Make sure their cool down has expired
    const coolDownSeconds = await getPairCodeCoolDown(userId);
    if (coolDownSeconds <= 0) {
      await assignPairCode(userId);
      return { message: 'Success! A pairing code has been generated for you. Please go into your settings in the Chat Everywhere app to find your code and enter it here using the command \'/pair <email> <code>\'' };
    }

    return {
      message: `You can request another pairing code in ${coolDownSeconds} seconds`,
      error: true,
    };
  } else if (args.length === 2) {
    if (!email || !isEmailValid(email)) {
      return {
        message: 'Invalid email',
        error: true,
      };
    }

    const { app, appUserId } = data;
    if (!app || !appUserId) {
      throw new Error('Missing \'app\' or \'appUserId\'');
    }

    const userId = await getUserIdByEmail(email);
    if (!userId) {
      return { message: 'Invalid pair code', error: true };
    }

    try {
      await validatePairCode(userId, pairCode, 'line');
    } catch (error) {
      if (error instanceof Error) {
        return { message: error.message, error: true };
      }
      return {
        message: 'Unable to validate code. Please try again later.',
        error: true,
      };
    }

    if (await isPaired(appUserId, app)) {
      return {
        message: 'Your account is already paired. Please unpair your account using \'/unpair\' before pairing it again.',
        error: true,
      }
    };

    try {
      await pair(userId, appUserId, app);
      return {
        message: 'Success! Your account is now paired.',
      };
    } catch (error) {
      if (error instanceof Error) {
        return { message: error.message, error: true };
      }
      return {
        message: 'Unable to pair your account. Please try again later.',
        error: true,
      };
    }
  } else {
    return {
      message: 'The command you entered is invalid. The proper usage is \'/pair <email>\' for generating a new pairing code or \'/pair <email> <code>\' to pair your account',
      error: true,
    };
  }
};

export const handleUnpairCommand = async (args: string[], data: CommandData): Promise<CommandResult> => {
  if (args.length === 0) {
    try {
      const { app, appUserId } = data;

      if (!app || !appUserId) {
        throw new Error('Missing \'app\' or \'appUserId\'');
      }

      if (!await isPaired(appUserId, app)) {
        return {
          message: 'Your account is already unpaired.',
          error: true,
        };
      }

      await unpair({ appUserId }, app);
      return { message: 'Success! Your account has been unpaired.' };
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return { message: error.message, error: true };
      }
      return {
        message: 'Unable to unpair your account. Please try again later.',
        error: true,
      };
    }
  } else {
    return {
      message: 'Wrong command execution. The proper usage is \'/unpair\'.',
      error: true,
    }
  }
};
