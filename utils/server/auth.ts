import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';

import { UserProfile } from '@/types/user';

import { getTeacherSettingsForStudent } from './supabase/teacher-settings';

const supabase = getAdminSupabaseClient();

export async function fetchUserProfileWithAccessToken(
  req: Request,
): Promise<UserProfile> {
  const accessToken = req.headers.get('access-token');
  if (!accessToken) throw new Error('No access token');

  const { data, error } = await supabase.auth.getUser(accessToken);
  const userId = data?.user?.id;
  if (!userId || error) throw new Error('User id not found');

  const userProfile = await getUserProfile(userId);
  if (!userProfile) throw new Error('User profile not found');

  return userProfile;
}

export const unauthorizedResponse = new Response('Unauthorized', {
  status: 401,
});

export async function isStudentAccount(userId: string): Promise<boolean> {
  const user = await getUserProfile(userId);
  return user?.isTempUser || false;
}

export async function allowAccountToUseLine(userId: string): Promise<boolean> {
  const teacherSettings = await getTeacherSettingsForStudent(userId);
  return teacherSettings?.allow_student_use_line || false;
}
