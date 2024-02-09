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

  // 1. Verify the code
  const isValid = await verifyCode(code);
  if (!isValid) {
    return new Response('Invalid code', { status: 400 });
  }

  // 2. Create a temp user with the uniqueId and code
  const user = await createTempUser(code, uniqueId);

  // 3. Return login info to the client
  return new Response(JSON.stringify(user), { status: 200 });
};

export default handler;

async function verifyCode(code: string) {
  const { data, error } = await supabase
    .from('teacher_one_time_codes')
    .select('code, expired_at')
    .eq('code', code)
    .eq('is_valid', true);
  if (error) {
    throw error;
  }

  console.log({ data });
  return data.length > 0;
}

async function createTempUser(code: string, uniqueId: string) {
  const randomUniqueId =
    uuidv4().replace(/-/g, '') + `-${uniqueId.replace(/\W/g, '')}`;
  const randomEmail = `temp-user-${randomUniqueId}-${code}@chateverywhere.app`;
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

// TODO: will be used in cron job
async function deleteUserById(id: string) {
  // delete profile
  const { error: deleteProfileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);
  if (deleteProfileError) {
    throw deleteProfileError;
  }
  // delete supabase user
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) {
    throw error;
  }
  return true;
}
