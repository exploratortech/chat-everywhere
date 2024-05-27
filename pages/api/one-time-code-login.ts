import { serverSideTrackEvent } from '@/utils/app/eventTracking';
import { getAdminSupabaseClient } from '@/utils/server/supabase';

import { v4 as uuidv4 } from 'uuid';

const supabase = getAdminSupabaseClient();
export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { code, uniqueId } = (await req.json()) as {
    code: string;
    uniqueId: string;
  };

  // 1. Verify the code and referrer account
  let codeId;
  try {
    codeId = await verifyCodeAndReferrerAccount(code);
  } catch (error) {
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    } else {
      console.error('Unknown error:', error);
      return new Response('An unknown error occurred', { status: 400 });
    }
  }
  if (!codeId) {
    return new Response('Invalid code', { status: 400 });
  }

  // 2. Create a temp user with the uniqueId and code
  const user = await createTempUser(code, codeId, uniqueId);

  // 3. Return login info to the client
  serverSideTrackEvent(user.userId, 'One-time code redeemed', {
    tempAccountName: uniqueId,
  });
  return new Response(JSON.stringify(user), { status: 200 });
};

export default handler;

async function verifyCodeAndReferrerAccount(code: string) {
  const { data, error } = await supabase.rpc('check_otc_quota_and_validity', {
    otc_code: code,
  });

  if (error) {
    throw error;
  }

  if (!data || !data.length) {
    console.error('check_otc_quota_and_validity:', data);
    throw new Error('Invalid code');
  }
  if (!data[0]?.has_quota) {
    throw new Error('Referrer exceeded the quota');
  }
  if (!data[0].code_is_valid) {
    throw new Error('Invalid code');
  }
  if (!data[0].code_is_not_expired) {
    throw new Error('Code is expired');
  }
  if (!data[0].referrer_is_teacher_account) {
    throw new Error('Referrer is not a teacher account');
  }
  return data[0].otc_id;
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
