import { DefaultMonthlyCredits } from '@/utils/config';

import { PluginID } from '@/types/plugin';
import { UserProfile } from '@/types/user';

import { generateRandomReferralCode } from './referralCode';

import { SupabaseClient, createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';

export const getAdminSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServerRoleKey = process.env.SUPABASE_SERVER_ROLE_KEY || '';
  return createClient(supabaseUrl, supabaseServerRoleKey, {
    auth: {
      persistSession: false,
    },
  });
};

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const supabase = getAdminSupabaseClient();
  return await userProfile(supabase, userId);
};

export const getIntervalUsages = async (
  apiType: PluginID,
  userId: string,
  hourInterval: number,
): Promise<number> => {
  const supabase = getAdminSupabaseClient();
  const { data: usages, error } = await supabase
    .from('api_usages')
    .select('id, api_type, user_id, timestamp')
    .eq('api_type', apiType)
    .eq('user_id', userId)
    .gte(
      'timestamp',
      new Date(Date.now() - hourInterval * 60 * 60 * 1000).toISOString(),
    )
    .order('timestamp', { ascending: true });

  if (error) {
    throw error;
  }

  return usages.length;
};

export const addUsageEntry = async (
  apiType: PluginID | 'gpt-3.5',
  userId: string,
): Promise<void> => {
  const supabase = getAdminSupabaseClient();
  const { error } = await supabase
    .from('api_usages')
    .insert([{ api_type: apiType, user_id: userId }]);

  if (error) {
    throw error;
  }
};

// Get user credits
export const getUserCredits = async (
  userId: string,
  apiType: PluginID,
): Promise<any> => {
  const supabase = getAdminSupabaseClient();
  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .eq('api_type', apiType);

  if (error) {
    throw error;
  }

  if (data && data.length > 0) {
    return data[0];
  } else {
    await addUserCreditsEntry(userId, apiType);
    return DefaultMonthlyCredits[apiType];
  }
};

// Update user credits
export const updateUserCredits = async (
  userId: string,
  apiType: PluginID,
  newBalance: number,
): Promise<void> => {
  const supabase = getAdminSupabaseClient();
  const { data: userCreditEntries, error } = await supabase
    .from('user_credits')
    .update({ balance: newBalance, last_updated: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('api_type', apiType)
    .select();

  if (error) {
    throw error;
  }

  if (!userCreditEntries || userCreditEntries.length === 0) {
    await addUserCreditsEntry(userId, apiType);
  }
};

// Subtract one credit from user's balance
export const subtractCredit = async (
  userId: string,
  apiType: PluginID,
): Promise<void> => {
  const userCredits = await getUserCredits(userId, apiType);
  const newBalance = userCredits.balance - 1;
  await updateUserCredits(userId, apiType, newBalance);
};

export const addBackCreditBy1 = async (
  userId: string,
  apiType: PluginID,
): Promise<void> => {
  const userCredits = await getUserCredits(userId, apiType);
  const newBalance = userCredits.balance + 1;
  await updateUserCredits(userId, apiType, newBalance);
};

// Add user credits entry
export const addUserCreditsEntry = async (
  userId: string,
  apiType: PluginID,
): Promise<void> => {
  const initialBalance = DefaultMonthlyCredits[apiType];
  const supabase = getAdminSupabaseClient();
  const { error } = await supabase
    .from('user_credits')
    .insert([{ user_id: userId, api_type: apiType, balance: initialBalance }]);

  if (error) {
    throw error;
  }
};

// Check if user has run out of credits
export const hasUserRunOutOfCredits = async (
  userId: string,
  apiType: PluginID,
): Promise<boolean> => {
  const userCredits = await getUserCredits(userId, apiType);
  return userCredits.balance <= 0;
};

export const isPaidUserByAuthToken = async (
  userToken: string | null,
): Promise<boolean> => {
  try {
    if (!userToken) return false;

    const supabase = getAdminSupabaseClient();
    const { data, error } = await supabase.auth.getUser(userToken || '');
    if (!data || error) return false;

    const user = await getUserProfile(data.user.id);
    if (!user) return false;

    if (user.plan === 'free') return false;

    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const batchRefreshReferralCodes = async (): Promise<void> => {
  try {
    const supabase = getAdminSupabaseClient();
    const { data: eduUserId, error: fetchEduIdError } = await supabase
      .from('profiles')
      .select('id')
      .eq('plan', 'edu');

    if (fetchEduIdError) {
      console.error(fetchEduIdError);
      throw new Error('Error fetching records');
    }

    if (!eduUserId) {
      throw new Error('No records found');
    }

    const newRecords = eduUserId.map((record) => {
      const generatedCode = generateRandomReferralCode();
      return {
        id: record.id,
        referral_code: generatedCode,
      };
    });

    const { data: refreshedRecords, error: refreshError } = await supabase.rpc(
      'refresh_referral_codes', // this function defined in supabase
      { payload: newRecords },
    );

    if (refreshError) {
      console.error(refreshError);
      throw new Error('Error refreshing referral codes');
    } else {
      console.log('Refreshed all referral codes');
    }
  } catch (e) {
    console.log(e);
    throw e;
  }
};

export const getReferralCode = async (userId: string): Promise<string> => {
  const supabase = getAdminSupabaseClient();
  const { data: record, error } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('plan', 'edu')
    .eq('id', userId)
    .single();

  let referralCode = record?.referral_code;

  if (!referralCode) {
    const newCode = generateRandomReferralCode();
    const { data: newRecord, error } = await supabase
      .from('profiles')
      .update({ referral_code: newCode })
      .eq('plan', 'edu')
      .eq('id', userId)
      .single();
    if (error) {
      throw error;
    }
    console.log({
      newRecord,
    });
    referralCode = (
      newRecord as {
        referral_code: string;
      }
    ).referral_code;
  }

  if (error) {
    throw error;
  }

  return referralCode;
};

export const isValidReferralCode = async (
  code: string,
): Promise<{
  isValid: boolean;
  referrerId?: string;
}> => {
  const supabase = getAdminSupabaseClient();
  const { data: record, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', code)
    .single();
  if (error) {
    throw error;
  }
  return {
    isValid: !!record,
    referrerId: record?.id,
  };
};

export const redeemReferralCode = async ({
  referrerId,
  referreeId,
}: {
  referrerId: string;
  referreeId: string;
}): Promise<void> => {
  const supabase = getAdminSupabaseClient();
  const trailDays =
    typeof process.env.REFERRAL_TRIAL_DAYS === 'string'
      ? parseInt(process.env.REFERRAL_TRIAL_DAYS)
      : 3;
  // create a record in the referral table
  const { error: referralError } = await supabase.from('referral').insert([
    {
      referrer_id: referrerId,
      referree_id: referreeId,
      referral_date: dayjs().toDate(),
    },
  ]);
  if (referralError) {
    throw referralError;
  }
  // upgrade the user to pro plan
  const { error: upgradeError } = await supabase
    .from('profiles')
    .update({
      plan: 'pro',
      pro_plan_expiration_date: dayjs().add(trailDays, 'days').toDate(),
    })
    .eq('id', referreeId);
  if (upgradeError) {
    throw upgradeError;
  }
};

export const userProfile = async (client: SupabaseClient, userId: string) => {
  const { data: user, error } = await client
    .from('profiles')
    .select('id, plan, pro_plan_expiration_date, referral_code')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return {
    id: user.id,
    plan: user.plan,
    referralCode: user.referral_code,
    proPlanExpirationDate: user.pro_plan_expiration_date,
  } as UserProfile;
};
