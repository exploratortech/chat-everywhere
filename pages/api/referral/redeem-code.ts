import {
  getReferralCodeDetail,
  redeemReferralCode,
} from '../../../utils/server/supabase';
import { getUserProfile, resetUserCredits } from '@/utils/server/supabase';

import { PluginID } from '@/types/plugin';
import { serverSideTrackEvent } from '@/utils/app/eventTracking';

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

    // Special 1 week trial code mainly for v2 in-field testing
    if (referralCode === process.env.TEMP_2_WEEKS_TRIAL_CODE) {
      await redeemReferralCode({
        referrerId: null,
        refereeId: userId,
        referralCode,
        lengthOfTrialInDays: 7,
      });

      serverSideTrackEvent(userId, 'v2 Trial redemption success');
      await resetUserCredits(userId, PluginID.GPT4);
      await resetUserCredits(userId, PluginID.IMAGE_GEN);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    const { isValid, referrerId } = await getReferralCodeDetail(referralCode);

    // Check if referral code is valid
    if (!isValid || !referrerId)
      return new Response('Invalid referral code', { status: 400 });

    // Redeem code and upgrade user account to Pro plan
    await redeemReferralCode({
      referrerId,
      refereeId: userId,
      referralCode,
    });

    await resetUserCredits(userId, PluginID.GPT4);
    await resetUserCredits(userId, PluginID.IMAGE_GEN);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Invalid Code', { status: 400 });
  }
};

export default handler;
