import { CommandResult } from "@/types/command";
import { PairPlatforms } from "@/types/pair";
import { isPaired, unpair } from "@/utils/server/pairing";

type Data = {
  app: PairPlatforms;
  appUserId: string;
}

export const handleUnpairCommand = async (args: string[], data: Data): Promise<CommandResult> => {
  if (args.length === 0) {
    return await unpairAccount(data);
  } else {
    return {
      message: 'Wrong command execution. The proper usage is \'/unpair\'.',
      error: true,
    }
  }
};

const unpairAccount = async ({ app, appUserId }: Data): Promise<CommandResult> => {
  try {
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
};
