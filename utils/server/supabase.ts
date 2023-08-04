import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

import { DefaultMonthlyCredits } from '@/utils/config';

import { PluginID } from '@/types/plugin';
import { RawRefereeProfile } from '@/types/referral';
import { UserProfile, UserProfileQueryProps } from '@/types/user';

import {
  CodeGenerationPayloadType,
  generateReferralCodeAndExpirationDate,
} from './referralCode';

import { createClient } from '@supabase/supabase-js';
import { Attachments } from '../app/attachments';
import { Attachment } from '@/types/attachment';

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
  return await userProfileQuery({
    client: supabase,
    userId,
  });
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
export const getUserCredits = async (userId: string, apiType: PluginID) => {
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
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .eq('api_type', apiType);
    if (error || !(data && data.length > 0)) {
      throw (
        error ||
        new Error(
          `No User Credit found after adding ${apiType} credit entry for user ${userId}`,
        )
      );
    }
    return data[0];
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

export const addCredit = async (
  userId: string,
  apiType: PluginID,
  credit: number,
): Promise<void> => {
  const userCredits = await getUserCredits(userId, apiType);
  const newBalance = userCredits.balance + credit;
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

// Reset user credits
export const resetUserCredits = async (
  userId: string,
  apiType: PluginID,
): Promise<void> => {
  updateUserCredits(userId, apiType, DefaultMonthlyCredits[apiType]);
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
    const { data: eduUserData, error: fetchEduIdError } = await supabase
      .from('profiles')
      .select('id, referral_code_expiration_date')
      .eq('plan', 'edu');

    if (fetchEduIdError) {
      console.error(fetchEduIdError);
      throw new Error('Error fetching records');
    }

    if (!eduUserData) {
      throw new Error('No records found');
    }

    // Regenerate referral code only if it's expired within 2 hour, and cron job will run every hour.
    let newRecords: {
      id: string;
      referral_code: string;
      referral_code_expiration_date: string;
    }[] = [];

    eduUserData.forEach((record) => {
      const existingCodeExpirationDate =
        record.referral_code_expiration_date &&
        dayjs(record.referral_code_expiration_date);

      if (
        !existingCodeExpirationDate ||
        dayjs().isAfter(existingCodeExpirationDate.subtract(2, 'hour'))
      ) {
        const { code: generatedCode, expiresAt: expirationDate } =
          generateReferralCodeAndExpirationDate();

        newRecords.push({
          id: record.id,
          referral_code: generatedCode,
          referral_code_expiration_date: expirationDate,
        });
      }
    });

    const { error: refreshError } = await supabase.rpc(
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

export const getReferralCode = async (
  userId: string,
): Promise<CodeGenerationPayloadType> => {
  try {
    const supabase = getAdminSupabaseClient();
    const { data: record, error } = await supabase
      .from('profiles')
      .select('referral_code, referral_code_expiration_date')
      .eq('plan', 'edu')
      .eq('id', userId)
      .single();

    let referralCode = record?.referral_code;
    let expirationDate = record?.referral_code_expiration_date;

    if (!referralCode) {
      const { code: generatedCode, expiresAt: expirationDate } =
        generateReferralCodeAndExpirationDate();

      const { data: newRecord, error } = await supabase
        .from('profiles')
        .update({
          referral_code: generatedCode,
          referral_code_expiration_date: expirationDate,
        })
        .eq('plan', 'edu')
        .eq('id', userId)
        .single();
      if (error) {
        throw error;
      }

      referralCode = (
        newRecord as {
          referral_code: string;
        }
      ).referral_code;
    }

    return {
      code: referralCode,
      expiresAt: expirationDate,
    };
  } catch (e) {
    console.log(e);
    throw e;
  }
};

export const getRefereesProfile = async (userId: string) => {
  try {
    const supabase = getAdminSupabaseClient();

    const { data, error } = await supabase.rpc(
      'get_referees_profile_by_referrer_id',
      { referrer: userId },
    );

    if (error) throw error;
    return data as RawRefereeProfile[];
  } catch (e) {
    console.log(e);
    throw e;
  }
};

export const regenerateReferralCode = async (
  userId: string,
): Promise<CodeGenerationPayloadType> => {
  try {
    const supabase = getAdminSupabaseClient();
    const { data: record, error: getProfileError } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('plan', 'edu')
      .eq('id', userId)
      .single();
    if (getProfileError) throw getProfileError;

    const { code: newGeneratedCode, expiresAt: newExpirationDate } =
      generateReferralCodeAndExpirationDate();
    const { data: newRecord, error: updateError } = await supabase
      .from('profiles')
      .update({
        referral_code: newGeneratedCode,
        referral_code_expiration_date: newExpirationDate,
      })
      .eq('plan', 'edu')
      .eq('id', userId)
      .single();
    if (updateError) {
      throw updateError;
    }

    return {
      code: newGeneratedCode,
      expiresAt: newExpirationDate,
    };
  } catch (e) {
    console.log(e);
    throw e;
  }
};

export const getReferralCodeDetail = async (
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
  refereeId,
}: {
  referrerId: string;
  refereeId: string;
}): Promise<void> => {
  const supabase = getAdminSupabaseClient();
  const trialDays =
    typeof process.env.NEXT_PUBLIC_REFERRAL_TRIAL_DAYS === 'string'
      ? parseInt(process.env.NEXT_PUBLIC_REFERRAL_TRIAL_DAYS)
      : 3;
  // create a record in the referral table
  const { error: referralError } = await supabase.from('referral').insert([
    {
      referrer_id: referrerId,
      referee_id: refereeId,
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
      pro_plan_expiration_date: dayjs().add(trialDays, 'days').toDate(),
    })
    .eq('id', refereeId);
  if (upgradeError) {
    throw upgradeError;
  }
};

export const userProfileQuery = async ({
  client,
  userId,
  email,
}: UserProfileQueryProps) => {
  if (!userId && !email) {
    throw new Error('Either userId or email must be provided');
  }
  let userProfile: {
    id: any;
    email: any;
    plan: any;
    pro_plan_expiration_date: any;
    referral_code: any;
    referral_code_expiration_date: any;
  } | null = null;
  if (userId) {
    const { data: user, error } = await client
      .from('profiles')
      .select(
        'id, email, plan, pro_plan_expiration_date, referral_code, referral_code_expiration_date',
      )
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }
    userProfile = user;
  } else if (email) {
    const { data: user, error } = await client
      .from('profiles')
      .select(
        'id, email, plan, pro_plan_expiration_date, referral_code, referral_code_expiration_date',
      )
      .eq('email', email)
      .single();
    if (error) {
      throw error;
    }
    userProfile = user;
  }

  if (!userProfile) throw new Error('User not found');

  const { data: referralTable, error: refereeError } = await client
    .from('referral')
    .select('*')
    .or(`referee_id.eq.${userProfile.id},referrer_id.eq.${userProfile.id}`);
  if (refereeError) {
    throw refereeError;
  }

  const referrerRecords = referralTable?.find(
    (r) => userProfile && r.referee_id === userProfile.id,
  );
  const refereeRecords = referralTable?.find(
    (r) => userProfile && r.referrer_id === userProfile.id,
  );

  const isInReferralTrial = (() => {
    if (!referrerRecords) return false;
    const referrerDate = dayjs(referrerRecords.referral_date);
    const trailDays = +(process.env.NEXT_PUBLIC_REFERRAL_TRIAL_DAYS || '3');
    const trailExpirationDate = referrerDate.add(trailDays, 'days');

    return dayjs().isBefore(trailExpirationDate);
  })();

  return {
    id: userProfile.id,
    email: userProfile.email,
    plan: userProfile.plan,
    referralCode: userProfile.referral_code,
    proPlanExpirationDate: userProfile.pro_plan_expiration_date,
    referralCodeExpirationDate: userProfile.referral_code_expiration_date,
    hasReferrer: !!referrerRecords,
    hasReferee: !!refereeRecords,
    isInReferralTrial: isInReferralTrial,
  } as UserProfile;
};

export const updateProAccountsPlan = async (): Promise<void> => {
  // UPDATE ALL USER WHOSE HAS PRO PLAN
  // AND THEIR EXPIRED DATE IS LESS THAN (TODAY - 1 DAY) TO FREE PLAN
  // GIVE ONE DAY PAYMENT GRACE PERIOD

  const supabase = getAdminSupabaseClient();
  const nowMinusOneDay = dayjs.utc().subtract(1, 'day').toISOString();

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ plan: 'free' })
    .eq('plan', 'pro')
    .lte('pro_plan_expiration_date', nowMinusOneDay);

  if (updateError) {
    throw updateError;
  }
};

export const fetchAttachments = async (userId: string, next?: string | null): Promise<{ files: Attachment[], next: string | null }> => {
  const limit = 25;
  const supabase = getAdminSupabaseClient();

  const query = supabase
    .from('files')
    .select()
    .eq('user_id', userId)
    .order('name', { ascending: true });

  let result!: any;
  if (next) {
    result = await query
      .gte('name', next)
      .limit(limit + 1);
  } else {
    result = await query.limit(limit + 1);
  }

  if (result.error) {
    throw result.error;
  }

  const files: Attachment[] = [];

  if (!result.data) return { files, next: null };

  // Return up to the `limit` number of rows
  for (let i = 0; i < limit; i++) {
    const file = result.data[i];

    if (file == null) break;

    // Skip the placeholder file created by supabase for empty directories
    if (file.name === '.emptyFolderPlaceholder') continue;

    files.push({
      name: Attachments.filenameFromPath(file.name)!,
      content: '',
      type: file.type,
      size: file.size,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
    });
  }

  console.log('files length', files.length);

  return { files, next: result.data[limit]?.name || null };
};

export const uploadAttachments = async (userId: string, files: File[]): Promise<any> => {
  const supabase = getAdminSupabaseClient();

  const uploads = [];
  const errors: { filename: string, error: string }[] = [];

  // 1. Upload files to storage. Files that fail to upload are added to
  // `errors`
  for (const file of files) {
    uploads.push(
      new Promise<File | null>(async (resolve) => {
        const { error } = await supabase
          .storage
          .from('files')
          .upload(
            `${userId}/${file.name}`,
            file,
            { contentType: 'text/plain', upsert: true },
          );
        
        if (error) {
          console.error(error);
          errors.push({ filename: file.name, error: error.message });
          resolve(null);
        }

        resolve(file);
      })
    );
  }

  const results = await Promise.all(uploads);
  const uploadedFiles = results.filter((result) => result != null) as File[];

  // 2. Create table entries for the files that were successfully uploaded
  const filesToUpsert: any[] = [];

  for (const file of uploadedFiles) {
    const now = dayjs().toISOString();
    filesToUpsert.push({
      id: uuidv4(),
      user_id: userId,
      name: file.name,
      type: file.type,
      size: file.size,
      path: `${userId}/${file.name}`,
      created_at: now,
      updated_at: now,
    });
  }

  const upsert = await supabase
    .from('files')
    .upsert(filesToUpsert, {
      onConflict: 'path',
      ignoreDuplicates: false,
    });

  if (upsert.error) {
    console.error(upsert.error.message);

    const remove = await supabase
      .storage
      .from('files')
      .remove(uploadedFiles.map((file) => `${userId}/${file.name}`));
    
    if (remove.error) {
      console.error(remove.error);
    }

    throw new Error('Unable to upload file(s)');
  }

  return errors;
};

// Returns a list of the filenames that were deleted
export const deleteAttachments = async (userId: string, filenames: string[]): Promise<string[]> => {
  const supabase = getAdminSupabaseClient();

  const { data, error } = await supabase
    .storage
    .from('attachments')
    .remove(filenames.map((filename) => `${userId}/${filename}`));

  if (error) {
    throw error;
  }

  if (!data) {
    return [];
  }

  return data.map((file) => Attachments.filenameFromPath(file.name) || '');
};
