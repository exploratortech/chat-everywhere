import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { getAdminSupabaseClient } from '@/utils/server/supabase';

import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

const supabase = getAdminSupabaseClient();
export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { code, uniqueId } = (await req.json()) as {
      code: string;
      uniqueId: string;
    };

    // 1. Verify the code
    const { teacherProfileId, validCodeId, maxTempAccountQuota } =
      await verifyCodeAndGetMaxTempAccountQuota(code);

    // 2. Check if the teacher profile has reached the max temp account quota
    const activeStudentAccountsNumber = await findActiveStudentAccountsNumber(
      teacherProfileId,
    );
    if (activeStudentAccountsNumber >= maxTempAccountQuota) {
      throw new Error('Max temp account quota reached');
    }

    // 3. Create a temp user with the uniqueId and code

    const user = await createTempUser(code, validCodeId, uniqueId);

    serverSideTrackEvent(user.userId, 'One-time code redeemed', {
      tempAccountName: uniqueId,
    });
    // 4. Return login info to the client
    return new Response(JSON.stringify(user), { status: 200 });
  } catch (error) {
    console.error('Error in handler:', error);
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
};

export default handler;

// Function to verify the one-time code and retrieve the teacher profile ID
async function verifyCodeAndGetMaxTempAccountQuota(code: string) {
  const { data, error: verifyCodeError } = await supabase
    .from('one_time_codes')
    .select(
      'id, teacher_profile_id, is_valid, expired_at, profiles(max_temp_account_quota)',
    )
    .eq('code', code)
    .single();

  if (verifyCodeError) {
    console.error('Error verifying code:', verifyCodeError);
    throw new Error(verifyCodeError.message);
  }

  if (!data.is_valid || dayjs(data.expired_at) < dayjs()) {
    throw new Error('Invalid code OR code is expired');
  }

  const profiles = data.profiles as unknown as {
    max_temp_account_quota: number;
  };
  return {
    teacherProfileId: data.teacher_profile_id,
    validCodeId: data.id,
    maxTempAccountQuota: profiles.max_temp_account_quota,
  };
}

async function findActiveStudentAccountsNumber(
  teacherProfileId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from('one_time_codes')
    .select(
      `
      id,
      temporary_account_profiles (
        id
      )
    `,
    )
    .eq('teacher_profile_id', teacherProfileId)
    .gte('expired_at', dayjs().toISOString());

  if (error) {
    console.error('Error fetching active student with join:', error);
    throw new Error(error.message);
  }
  const totalTemporaryAccountProfiles = data.reduce(
    (acc, entry) => acc + entry.temporary_account_profiles.length,
    0,
  );

  return totalTemporaryAccountProfiles;
}

async function createTempUser(code: string, codeId: string, uniqueId: string) {
  // get teacher profile id by codeId
  const { data: oneTimeCodeData, error: oneTimeCodeError } = await supabase
    .from('one_time_codes')
    .select('teacher_profile_id')
    .eq('id', codeId)
    .single();

  if (oneTimeCodeError) {
    throw oneTimeCodeError;
  }

  const teacherProfileId = oneTimeCodeData.teacher_profile_id;

  const randomUniqueId = uuidv4().replace(/-/g, '');
  const randomEmail = `temp-user-${code}-${randomUniqueId}@chateverywhere.app`;
  const randomPassword = uuidv4();
  const createUserRes = await supabase.auth.admin.createUser({
    email: randomEmail,
    password: randomPassword,
    email_confirm: true, // even though we disabled "Confirm Email", it's still required
  });
  if (createUserRes.error) {
    throw createUserRes.error;
  }
  const userId = createUserRes.data.user.id;

  // create a temporary account profile
  const { error: createTempProfileError } = await supabase
    .from('temporary_account_profiles')
    .insert([
      {
        one_time_code_id: codeId,
        profile_id: userId,
        uniqueId: uniqueId,
        teacher_profile_id: teacherProfileId,
      },
    ]);
  if (createTempProfileError) {
    throw createTempProfileError;
  }

  // update profile
  const { error: updateProfileError } = await supabase
    .from('profiles')
    .update({ plan: 'ultra' })
    .eq('id', userId);

  if (updateProfileError) {
    throw updateProfileError;
  }
  return {
    userId,
    randomEmail,
    randomPassword,
  };
}
