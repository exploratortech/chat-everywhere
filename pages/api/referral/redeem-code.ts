import {
  isValidReferralCode,
  redeemReferralCode,
} from '../../../utils/server/supabase';
import { getReferralCode, getUserProfile } from '@/utils/server/supabase';

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

    const { referralCode } = (await req.json()) as {
      referralCode: string;
    };

    const { isValid, referrerId } = await isValidReferralCode(referralCode);

    // Check if referral code is valid
    if (!isValid || !referrerId)
      return new Response('Invalid referral code', { status: 400 });

    // Redeem code and upgrade user account to Pro plan
    await redeemReferralCode({
      referrerId,
      referreeId: userId,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response('Invalid Code', { status: 500 });
  }
};

export default handler;
