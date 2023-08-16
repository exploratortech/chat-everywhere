import { getAdminSupabaseClient } from './supabase';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { v4 as uuidv4 } from "uuid";

import { PAIR_CODE_CHARACTERS, PAIR_CODE_COOL_DOWN, PAIR_CODE_LENGTH, PAIR_CODE_LIFETIME } from '../app/const';

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
    throw new Error('Unable to get pair code cool down');
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

// Gets an InstantMessageAppUser via `userId` or third-party user id
export const getInstantMessageAppUser = async (
  options: { userId?: string, appUserId?: string, app?: 'line' },
): Promise<Record<string, any> | null> => {
  const { userId, appUserId, app } = options;

  const supabase = getAdminSupabaseClient();
  const builder = supabase
    .from('instant_message_app_users')
    .select('user_id, line_id, pair_code, pair_code_expires_at, pair_code_generated_at');
    
  let result!: any;
  
  if (userId) {
    result = await builder.eq('user_id', userId).maybeSingle();
  } else if (appUserId && app) {
    result = await builder.eq(`${app}_id`, appUserId).maybeSingle();
  } else {
    throw new Error('Missing either userId or appUserId');
  }
  
  if (result.error) {
    console.error(result.error);
    return null;
  }

  if (!result.data) {
    return null;
  }

  const { data } = result;

  return {
    userId: data.user_id,
    lineId: data.line_id,
    pairCode: data.pair_code,
    pairCodeExpiresAt: data.pair_code_expires_at,
    pairCodeGeneratedAt: data.pair_code_generated_at,
  };
};

export const validatePairCode = async (userId: string, pairCode: string): Promise<void> => {
  const supabase = getAdminSupabaseClient();
  const { data, error } = await supabase
    .from('instant_message_app_users')
    .select('pair_code, pair_code_expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error(error);
    throw new Error('Unable to validate code. Please try again later.');
  }

  if (
    !data
    || didPairCodeExpire(data.pair_code_expires_at)
    || data.pair_code !== pairCode.toUpperCase()
  ) {
    throw new Error('Invalid pair code');
  }
};

export const pair = async (
  userId: string,
  appUserId: string,
  app: 'line',
): Promise<void> => {
  const supabase = getAdminSupabaseClient();

  const results = await Promise.all([
    // Invalidate pair code
    supabase
      .from('instant_message_app_users')
      .update({
        [`${app}_id`]: appUserId,
        pair_code_expires_at: dayjs().toISOString(),
      })
      .eq('user_id', userId),
    // Assign user's ChatEverywhere ID to Conversation
    supabase
      .from('conversations')
      .update({ user_id: userId })
      .eq('app_user_id', appUserId)
  ]);

  for (const result of results) {
    if (result.error) {
      // Revert changes
      await Promise.all([
        supabase
          .from('instant_message_app_users')
          .update({ [`${app}_id`]: null })
          .eq('user_id', userId),
        supabase
          .from('conversations')
          .update({ user_id: null })
          .eq('app_user_id', appUserId)
      ]);
      
      console.error(result.error);
      throw new Error('Unable to pair your account. Please try again later');
    }
  }
};
