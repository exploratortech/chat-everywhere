import { getHomeUrl } from '@/utils/app/api';
import {
  getAdminSupabaseClient,
  getOneTimeCodeInfo,
  getUserProfile,
} from '@/utils/server/supabase';

export const config = {
  runtime: 'edge',
};

const supabase = getAdminSupabaseClient();
const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const handler = async (req: Request): Promise<Response> => {
  try {
    const accessToken = req.headers.get('access-token');
    const invalidate = req.headers.get('invalidate') === 'true';
    if (!accessToken) return unauthorizedResponse;

    const { data, error } = await supabase.auth.getUser(accessToken);
    const userId = data?.user?.id;
    if (!userId || error || !data?.user?.id) return unauthorizedResponse;

    if (error) {
      return new Response('Error', { status: 500 });
    }

    const userProfile = await getUserProfile(userId);

    if (!userProfile || !userProfile.isTeacherAccount)
      return unauthorizedResponse;

    let oneTimeCodeInfo;
    oneTimeCodeInfo = await getOneTimeCodeInfo(userId, invalidate);

    // REMOVE THE EXPIRED ACCOUNT AND CODES AND FETCH AGAIN
    if (
      oneTimeCodeInfo?.tempAccountProfiles.some((profile) => profile.is_expired)
    ) {
      const host = getHomeUrl();

      await fetch(`${host}/api/cron/delete-expired-temp-accounts-and-code`);
      oneTimeCodeInfo = await getOneTimeCodeInfo(userId, invalidate);
    }

    if (!oneTimeCodeInfo) return new Response('Error', { status: 500 });
    const {
      code,
      expiresAt,
      tempAccountProfiles,
      maxQuota,
      totalActiveTempAccount,
    } = oneTimeCodeInfo;

    return new Response(
      JSON.stringify({
        code,
        expiresAt,
        tempAccountProfiles: tempAccountProfiles || [],
        maxQuota,
        totalActiveTempAccount,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
