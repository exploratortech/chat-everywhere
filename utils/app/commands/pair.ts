import { CommandResult } from "@/types/command";
import { PairPlatforms } from "@/types/pair";
import { assignPairCode, didPairCodeExpire, getPairCodeCoolDown, isPaired, pair } from "@/utils/server/pairing";
import { isEmailValid } from "../validation";
import { getInstantMessageAppUser, getUserIdByEmail } from "@/utils/server/supabase";

type Data = {
  app: PairPlatforms;
  appUserId: string;
}

export const handlePairCommand = async (args: string[], data: Data): Promise<CommandResult> => {
  if (args.length === 0) {
    return await getPairStatus(data);
  } else if (args.length === 1) {
    return await generatePairCode(args, data);
  } else if (args.length === 2) {
    return await pairAccount(args, data);
  } else {
    return {
      message: 'The command you entered is invalid. The proper usage is \'/pair <email>\' for generating a new pairing code or \'/pair <email> <code>\' to pair your account',
      error: true,
    };
  }
};

const getPairStatus = async ({ app, appUserId }: Data): Promise<CommandResult> => {
  if (await isPaired(appUserId, app)) {
    return { message: 'Your account is paired.' };
  } else {
    return { message: 'Your account isn\'t paired. Use "/pair <email>" to get started.' };
  }
};

const generatePairCode = async ([email]: string[], { app, appUserId }: Data): Promise<CommandResult> => {
  if (!email || !isEmailValid(email)) {
    return {
      message: 'Invalid email',
      error: true,
    };
  }

  // if (await isPaired(appUserId, app)) {
  //   return {
  //     message: 'Your account is already paired. Disconnect your account using "/unpair" before pairing again.',
  //     error: true,
  //   };
  // }

  // Return a success message to prevent malicious users from figuring out
  // if an email is registered on the platform
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
};

const pairAccount = async ([email, pairCode]: string[], { app, appUserId }: Data): Promise<CommandResult> => {
  if (!email || !isEmailValid(email)) {
    return {
      message: 'Invalid email',
      error: true,
    };
  }

  const userId = await getUserIdByEmail(email);
  if (!userId) {
    return { message: 'Invalid pair code', error: true };
  }

  const instantMessageAppUser = await getInstantMessageAppUser({ userId });
  if (instantMessageAppUser == null) {
    // 'instantMessageAppUser' may not exist because it's likely they haven't
    // generated a pair code
    return { message: 'Invalid pair code', error: true };
  }

  try {
    // Validate pair code
    if (
      didPairCodeExpire(instantMessageAppUser.pairCodeExpiresAt)
      || instantMessageAppUser.pairCode.toUpperCase() !== pairCode.toUpperCase()
    ) {
      return { message: 'Invalid pair code', error: true };
    }
  } catch (error) {
    if (error instanceof Error) {
      return { message: error.message, error: true };
    }
    return {
      message: 'Unable to validate code. Please try again later.',
      error: true,
    };
  }

  if (instantMessageAppUser[`${app}Id`] === appUserId) {
    return {
      message: 'Your account is already paired to this email.',
      error: true,
    };
  }

  if (instantMessageAppUser[`${app}Id`] != null) {
    return {
      message: 'Another account is already paired to this email.',
      error: true,
    };
  }

  try {
    await pair(userId, appUserId, app);
    return { message: 'Success! Your account is now paired.' };
  } catch (error) {
    if (error instanceof Error) {
      return { message: error.message, error: true };
    }
    return {
      message: 'Unable to pair your account. Please try again later.',
      error: true,
    };
  }
};
