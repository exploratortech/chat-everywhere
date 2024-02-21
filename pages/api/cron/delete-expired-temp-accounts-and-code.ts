import {
  batchRefreshReferralCodes,
  getAdminSupabaseClient,
} from '../../../utils/server/supabase';
import { deleteUserById } from '@/utils/server/deleteUserById';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  const supabase = getAdminSupabaseClient();
  try {
    // find code where expiresAt is less than current time, and its linked tempAccountProfiles profile id
    const currentTime = dayjs.utc().toISOString();
    const { data: expiredCodeAccount, error: expiredCodesError } =
      await supabase
        .from('one_time_codes')
        .select('code, temporary_account_profiles(profile_id)')
        .lte('expired_at', currentTime);

    if (expiredCodesError) {
      throw expiredCodesError;
    }

    // delete all tempAccountProfiles that are linked to the code
    const profileIdsToDelete = expiredCodeAccount.flatMap((code) =>
      code.temporary_account_profiles.map(
        (profile) => profile.profile_id as string,
      ),
    );

    for (const profileId of profileIdsToDelete) {
      console.log('Deleting profile', profileId);
      await deleteUserById(profileId);
    }

    // finally, delete all one time codes that are expired
    const codeIdsToDelete = expiredCodeAccount.map(
      (code) => code.code as string,
    );

    if (codeIdsToDelete.length > 0) {
      const { error: deleteCodesError } = await supabase
        .from('one_time_codes')
        .delete()
        .in('code', codeIdsToDelete);

      if (deleteCodesError) {
        throw deleteCodesError;
      }
      console.log(`Deleted ${codeIdsToDelete.length} expired one-time codes.`);
    } else {
      console.log('No expired one-time codes to delete.');
    }

    return new Response(
      JSON.stringify({
        expiredCodeAccount,
        profileIdsToDelete,
        codeIdsToDelete,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
