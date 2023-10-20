import {
  fetchValidReferralCodes,
  getReferralCodeDetail,
  redeemReferralCode,
} from '../../../utils/server/supabase';
import { trackError } from '@/utils/app/azureTelemetry';
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
      throw new Error('User must be on free plan');

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

    const formattedReferralCode = referralCode.trim().toUpperCase();

    const { isValid, referrerId } = await getReferralCodeDetail(
      formattedReferralCode,
    );

    // Check if referral code is valid
    if (!isValid || !referrerId) {
      await logReferralCodeResult(formattedReferralCode, false);
      throw new Error('Invalid referral code');
    } else {
      await logReferralCodeResult(formattedReferralCode, true);
    }

    // Redeem code and upgrade user account to Pro plan
    await redeemReferralCode({
      referrerId,
      refereeId: userId,
    });

    await resetUserCredits(userId, PluginID.GPT4);
    await resetUserCredits(userId, PluginID.IMAGE_GEN);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      trackError(error.message);
      return new Response(error.message, { status: 400 });
    } else {
      trackError(error as string);
      return new Response('Invalid code', { status: 500 });
    }
  }
};

const logReferralCodeResult = async (
  referralCode: string,
  successful: boolean,
) => {
  const validReferralCodes = await fetchValidReferralCodes();
  console.log(
    `User entered referral code ${referralCode}. Valid referral codes are [${validReferralCodes.join(', ',)}]`,
    successful ? '(VALID CODE)' : '(INVALID CODE)',
  );
};

export default handler;
