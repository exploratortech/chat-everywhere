import { deleteUserById } from '@/utils/server/deleteUserById';
import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';

export const config = {
  runtime: 'edge',
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { accessToken, tempAccountIds } = (await req.json()) as {
    accessToken: string;
    tempAccountIds: number[];
  };
  if (!accessToken || !tempAccountIds) {
    return new Response('Missing accessToken or tempAccountId', {
      status: 400,
    });
  }
  const supabase = getAdminSupabaseClient();

  // check if the user is a teacher
  const userRes = await supabase.auth.getUser(accessToken);
  if (!userRes || userRes.error) {
    console.error('No user found with this access token');
    return new Response('No user found with this access token', {
      status: 400,
    });
  }

  const userId = userRes.data.user.id;

  const user = await getUserProfile(userId);
  if (!user.isTeacherAccount) {
    return unauthorizedResponse;
  }

  const teacherProfileId = userId;

  // check if the temporary account id is valid, and if it's linked to the teacher profile
  const { data: tempAccountInfo, error: tempAccountError } = await supabase
    .from('temporary_account_profiles')
    .select(
      `
      *,
      one_time_codes (
        teacher_profile_id
      ),
      profiles (
        id
      )
    `,
    )
    .in('id', tempAccountIds);

  if (tempAccountError) {
    console.error(
      'Error retrieving temporary account information:',
      tempAccountError.message,
    );
    return new Response('Error retrieving temporary account information', {
      status: 500,
    });
  }
  if (!tempAccountInfo) {
    console.error('Temporary account not found');
    return new Response('Temporary account not found', { status: 404 });
  }
  if (
    tempAccountInfo.every(
      (tempAccount) =>
        tempAccount.one_time_codes.teacher_profile_id !== teacherProfileId,
    )
  ) {
    console.error('Teacher profile id does not match');
    return unauthorizedResponse;
  }

  // remove the temporary account
  try {
    await Promise.all(
      tempAccountInfo.map((tempAccount) =>
        deleteUserById(tempAccount.profiles.id),
      ),
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error removing temporary account:', error.message);
    } else {
      console.error('Error removing temporary account:', error);
    }
    return new Response('Error removing temporary account', { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};

export default handler;
