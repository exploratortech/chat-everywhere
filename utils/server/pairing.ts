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
    .maybeSingle();

  if (error) {
    console.error(error);
    return 0;
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
    return (timestamp.valueOf() - now.valueOf()) / 1000;
  }
};

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

export const getInstantMessageAppUser = async (userId: string): Promise<Record<string, any> | null> => {
  const supabase = getAdminSupabaseClient();
  const { data, error } = await supabase
    .from('instant_message_app_users')
    .select('line_id, pair_code, pair_code_expires_at, pair_code_generated_at')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) {
    console.error(error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    lineId: data.line_id,
    pairCode: data.pair_code,
    pairCodeExpiresAt: data.pair_code_expires_at,
    pairCodeGeneratedAt: data.pair_code_generated_at,
  };
};
