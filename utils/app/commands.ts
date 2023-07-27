import { CommandResult } from "@/types/command";
import { assignPairCode, getPairCodeCoolDown } from "../server/pairing";
import { getUserIdByEmail } from "../server/supabase";
import { isEmailValid } from "./validation";

export function isCommand(input: string): boolean {
  return !!input.match(/^\s*\/pair/i);
};

function parseCommand(input: string): string[] {
  let formattedCommand = input.replace(/\s+/g, ' ').trim();
  return formattedCommand.split(' ');
};

export async function executeCommand(input: string): Promise<CommandResult> {
  const [command, ...args] = parseCommand(input);

  try {
    switch (command) {
      case '/pair': return await handlePairCommand(args);
      default:
        return {
          message: `Unknown command '${command}'`,
          error: true,
        };
    }
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return {
        message: error.message,
        error: true,
      };
    } else {
      return {
        message: 'Unable to complete request. Please try again later',
        error: true,
      };
    }
  }
};

export async function handlePairCommand (args: string[]): Promise<CommandResult> {
  const [email, pairCode] = args;

  if (args.length === 1) {
    // args: <email>
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
    // args: <email> <pair_code>
    return { message: 'Need to implement' };
  } else {
    // Error, show usage
    return { message: 'The command you entered is invalid. The proper usage is \'/pair <email>\' for generating a new pairing code or \'/pair <email> <code>\' to pair your account' };
  }
};
