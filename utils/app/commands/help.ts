import { CommandResult } from "@/types/command";

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
