import {
  OneTimeCodeInfoPayload,
  TempAccountProfiles,
} from '@/types/one-time-code';

import { generateOneCodeAndExpirationDate } from '../referralCode';
import { getAdminSupabaseClient } from '../supabase';

import { SupabaseClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';

export const getOneTimeCodeInfo = async (
  userId: string,
  invalidate: boolean = false,
  tag_ids_for_invalidate: number[] = [],
): Promise<OneTimeCodeInfoPayload | undefined> => {
  try {
    const supabase = getAdminSupabaseClient();

    const [profileResult, recordResult, allValidOneTimeCodesResult] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('one_time_code_duration')
          .eq('id', userId)
          .single(),
        supabase.rpc('get_latest_valid_one_time_code_info', {
          teacher_profile_id_param: userId,
        }),
        supabase
          .from('one_time_codes')
          .select('id')
          .eq('teacher_profile_id', userId)
          .eq('is_valid', true),
      ]);

    const { data: profile, error: profileError } = profileResult;
    const { data: record, error: recordError } = recordResult;
    const { data: allValidOneTimeCodes, error: allValidOneTimeCodesError } =
      allValidOneTimeCodesResult;

    if (profileError || recordError || allValidOneTimeCodesError) {
      console.error('Error fetching data:', {
        profileError,
        recordError,
        allValidOneTimeCodesError,
      });
      throw profileError || recordError || allValidOneTimeCodesError;
    }

    // Invalidate the existing code if requested
    if (invalidate && allValidOneTimeCodes?.length) {
      const invalidateErrors = await Promise.all(
        allValidOneTimeCodes.map(({ id }) =>
          supabase
            .from('one_time_codes')
            .update({ is_valid: false })
            .eq('id', id)
            .then(({ error }) => error),
        ),
      );

      const firstError = invalidateErrors.find((error) => !!error);
      if (firstError) {
        console.log('invalidate failed error', firstError);
        throw firstError;
      }
    }

    if (invalidate || !record?.length) {
      let generatedCode, expirationDate;
      do {
        ({ code: generatedCode, expiresAt: expirationDate } =
          generateOneCodeAndExpirationDate(profile?.one_time_code_duration));

        const { data: existingCodes, error: existingCodesError } =
          await supabase
            .from('one_time_codes')
            .select('code')
            .eq('code', generatedCode)
            .eq('is_valid', true);

        if (existingCodesError) {
          console.log('existingCodesError', existingCodesError);
          throw existingCodesError;
        }

        if (existingCodes.length === 0) {
          const { data, error } = await supabase
            .from('one_time_codes')
            .insert({
              code: generatedCode,
              expired_at: expirationDate,
              teacher_profile_id: userId,
              is_valid: true,
            })
            .select('id')
            .single();

          if (error) {
            throw error;
          }
          const oneTimeCodeId = data.id;

          // If there are tag_ids, insert them into one_time_code_tags
          if (tag_ids_for_invalidate.length > 0) {
            const tagInsertErrors = await Promise.all(
              tag_ids_for_invalidate.map((tag_id) =>
                supabase
                  .from('one_time_code_tags')
                  .insert({
                    one_time_code_id: oneTimeCodeId,
                    tag_id: tag_id,
                  })
                  .then(({ error }) => error),
              ),
            );

            const firstTagInsertError = tagInsertErrors.find(
              (error) => !!error,
            );
            if (firstTagInsertError) {
              console.error('Tag insertion failed:', firstTagInsertError);
              throw firstTagInsertError;
            }
          }

          break; // Exit loop if code is unique
        }
      } while (true);

      const accountData = await fetchLatestValidOneTimeCodeInfo(
        supabase,
        userId,
      );
      if (!accountData) {
        throw new Error('No record found');
      }
      return formatOneTimeCodeInfo(
        accountData,
        generatedCode,
        expirationDate,
        accountData.active_temp_account_profiles,
      );
    } else {
      const existedRecord = (record as OneTimeCodeInfo[]).pop();
      if (!existedRecord) {
        throw new Error('No record found');
      }

      return formatOneTimeCodeInfo(
        existedRecord,
        existedRecord?.code,
        existedRecord?.code_expired_at,
        existedRecord?.active_temp_account_profiles,
      );
    }
  } catch (e) {
    console.log(e);
    throw e;
  }
};

async function fetchLatestValidOneTimeCodeInfo(
  supabase: SupabaseClient<any, 'public', any>,
  userId: string,
): Promise<OneTimeCodeInfo | undefined> {
  const { data, error } = await supabase.rpc(
    'get_latest_valid_one_time_code_info',
    {
      teacher_profile_id_param: userId,
    },
  );
  if (error) throw error;
  return data?.[0] as OneTimeCodeInfo | undefined;
}

function formatOneTimeCodeInfo(
  record: OneTimeCodeInfo,
  code: string,
  expiresAt: string,
  tempProfiles: TempAccountProfiles[] = [],
): OneTimeCodeInfoPayload {
  return {
    code_id: record.code_id,
    code,
    expiresAt,
    tempAccountProfiles: (tempProfiles || []).map((profile) => ({
      ...profile,
      is_expired: dayjs(profile.expired_at).isBefore(dayjs()),
    })),
    maxQuota: record.referrer_max_temp_account_quota,
    totalActiveTempAccount: record.current_total_referrer_temp_account_number,
  };
}

type OneTimeCodeInfo = {
  code_id: string;
  code: string;
  code_is_valid: boolean;
  code_expired_at: string;
  referrer_is_teacher_account: boolean;
  referrer_max_temp_account_quota: number;
  current_total_referrer_temp_account_number: number;
  active_temp_account_profiles: TempAccountProfiles[];
};
