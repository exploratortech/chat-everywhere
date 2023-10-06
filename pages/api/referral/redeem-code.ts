import {
  getReferralCodeDetail,
  redeemReferralCode,
} from '../../../utils/server/supabase';
import { trackError } from '@/utils/server/azureAppInsights';
import { getUserProfile, resetUserCredits } from '@/utils/server/supabase';

import { PluginID } from '@/types/plugin';

export const config = {
  runtime: 'edge',
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const handler = async (req: Request): Promise<Response> => {
  try {
    const userId = req.headers.get('user-id');
    if (!userId) return unauthorizedResponse;
    const userProfile = await getUserProfile(userId);

    if (!userProfile) return unauthorizedResponse;

    if (userProfile.plan !== 'free')
      return new Response('User must be on free plan', { status: 400 });

    // Disable for now
    // Check if user has already redeemed a referral code before
    // const supabase = getAdminSupabaseClient();
    // const { data: userReferralCodeHistory } = await supabase
    //   .from('referral')
    //   .select('id')
    //   .eq('referee_id', userId)
    //   .single();

    // if (userReferralCodeHistory) {
    //   return new Response('User has already redeemed a referral code', {
    //     status: 403,
    //   });
    // }

    const { referralCode } = (await req.json()) as {
      referralCode: string;
    };

    const { isValid, referrerId } = await getReferralCodeDetail(referralCode);

    // Check if referral code is valid
    if (!isValid || !referrerId)
      return new Response('Invalid referral code', { status: 400 });

    // Redeem code and upgrade user account to Pro plan
    await redeemReferralCode({
      referrerId,
      refereeId: userId,
    });

    await resetUserCredits(userId, PluginID.GPT4);
    await resetUserCredits(userId, PluginID.IMAGE_GEN);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    //Log error to Azure App Insights
    trackError(error as string);
    return new Response('Invalid Code', { status: 500 });
  }
};

export default handler;
