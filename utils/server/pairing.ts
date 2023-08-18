import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { v4 as uuidv4 } from "uuid";

import { getAdminSupabaseClient } from './supabase';
import type { PairPlatforms } from '@/types/pair';

import {
  PAIR_CODE_CHARACTERS,
  PAIR_CODE_COOL_DOWN,
  PAIR_CODE_LENGTH,
  PAIR_CODE_LIFETIME,
} from '../app/const';

dayjs.extend(isSameOrBefore);

const generatePairCode = (): string => {
  let code = '';
  for (let i = 0; i < PAIR_CODE_LENGTH; i++) {
    const charAt = Math.floor(Math.random() * PAIR_CODE_CHARACTERS.length);
    code += PAIR_CODE_CHARACTERS.charAt(charAt);
  }
  return code.toUpperCase();
};

export const didPairCodeExpire = (pairCodeExpiresAt: string): boolean => {
  const expirationTimestamp = dayjs(pairCodeExpiresAt);
  return expirationTimestamp.isSameOrBefore(dayjs());
};

export const getPairCodeCoolDown = async (userId: string): Promise<number> => {
  const supabase = getAdminSupabaseClient();
  const { data, error } = await supabase
    .from('instant_message_app_users')
    .select('pair_code_generated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error(error);
    throw new Error('Failed to get pair code cool down.');
  }

  if (!data || !data.pair_code_generated_at) {
    return 0;
  }

  const now = dayjs();
  const timestamp = dayjs(data.pair_code_generated_at).add(PAIR_CODE_COOL_DOWN, 'seconds');
  if (timestamp.isSameOrBefore(now)) {
    return 0;
  } else {
    console.log((timestamp.valueOf() - now.valueOf()) / 1000);
    return Math.round((timestamp.valueOf() - now.valueOf()) / 1000);
  }
};

// Creates an InstantMessageAppUser record if it doesn't already exist and
// generates a pair code.
export const assignPairCode = async (userId: string): Promise<any> => {
  const supabase = getAdminSupabaseClient();

  const now = dayjs();

  const { data, error } = await supabase
    .from('instant_message_app_users')
    .upsert({
      id: uuidv4(),
      user_id: userId,
      pair_code: generatePairCode(),
      pair_code_generated_at: now.toISOString(),
      pair_code_expires_at: now.add(PAIR_CODE_LIFETIME, 'seconds'),
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    
  };
};

// Throws an error when the pair code is invalid. Returns an
// InstantMessageAppUser record
// export const validatePairCode = async (
//   userId: string,
//   pairCode: string,
//   app: PairPlatforms,
// ): Promise<Record<string, any>> => {
//   const supabase = getAdminSupabaseClient();
//   const { data, error } = await supabase
//     .from('instant_message_app_users')
//     .select(`pair_code, pair_code_expires_at, ${app}_id`)
//     .eq('user_id', userId)
//     .maybeSingle();

//   if (error || !data) {
//     if (error) console.error(error);
//     throw new Error('Unable to validate code. Please try again later.');
//   }

//   if (
//     didPairCodeExpire(data.pair_code_expires_at)
//     || data.pair_code !== pairCode.toUpperCase()
//   ) {
//     throw new Error('Invalid pair code');
//   }

//   return data;
// };

export const pair = async (
  userId: string,
  appUserId: string,
  app: PairPlatforms,
): Promise<void> => {
  const supabase = getAdminSupabaseClient();

  // Assign appUserId to record and invalidate pair code
  const instantMessageAppUserResult = await supabase
    .from('instant_message_app_users')
    .update({
      [`${app}_id`]: appUserId,
      pair_code_expires_at: dayjs().toISOString(),
    })
    .eq('user_id', userId);

  if (instantMessageAppUserResult.error) {
    if (instantMessageAppUserResult.error.code === '23505') {
      throw new Error('Account is already paired to another email.');
    } else {
      console.error(instantMessageAppUserResult.error);
      throw new Error();
    }
  }
  
  // Assign user's ChatEverywhere ID to Conversation
  const conversationResult = await supabase
    .from('conversations')
    .update({ user_id: userId })
    .eq('app_user_id', appUserId);

  if (conversationResult.error) {
    // Revert changes to instantMessageAppUser record
    const { error } = await supabase
      .from('instant_message_app_users')
      .update({ [`${app}_id`]: null })
      .eq('user_id', userId);

    if (error) {
      console.error(`Failed to revert changes to instantMessageAppUser for user (${appUserId}) on app (${app})`, error);
    }

    console.error(error);
    throw new Error();
  }
};

// Removes the user's third-party user id from their InstantMessageAppUsers
// record. Accepts either userId or appUserId.
export const unpair = async (
  options: { userId?: string, appUserId?: string },
  app: PairPlatforms,
): Promise<void> => {
  const { userId, appUserId } = options;

  if (!userId && !appUserId) {
    throw new Error('Missing either userId or appUserId');
  }

  if (userId && appUserId) {
    throw new Error('Both \'userId\' and \'appUserId\' were provided.');
  }

  const supabase = getAdminSupabaseClient();
  let result!: any;

  if (userId) {
    result = await supabase
      .from('instant_message_app_users')
      .update({ [`${app}_id`]: null })
      .eq('user_id', userId);
  } else {
    result = await supabase
      .from('instant_message_app_users')
      .update({ [`${app}_id`]: null })
      .eq(`${app}_id`, appUserId);
  }

  if (result.error) {
    throw new Error(result.error.message);
  }
};

export const isPaired = async (
  appUserId: string,
  app: PairPlatforms,
): Promise<boolean> => {
  const supabase = getAdminSupabaseClient();
  const { count, error } = await supabase
    .from('instant_message_app_users')
    .select('*', { head: true, count: 'exact' })
    .eq(`${app}_id`, appUserId);

  if (error) {
    throw new Error(error.message);
  }

  if (count == null) {
    throw new Error('Unable to determine pairing');
  }

  return count !== 0;
};
