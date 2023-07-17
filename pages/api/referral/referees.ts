import { getRefereesProfile, getUserProfile } from '@/utils/server/supabase';
import { captureException, wrapApiHandlerWithSentry } from '@sentry/nextjs';

import dayjs from 'dayjs';

export const config = {
  runtime: 'edge',
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const handler = async (req: Request): Promise<Response> => {
  try {
    const userId = req.headers.get('user-id');
    if (!userId) return unauthorizedResponse;
    const userProfile = await getUserProfile(userId);

    if (!userProfile || userProfile.plan !== 'edu') return unauthorizedResponse;

    const referees = await getRefereesProfile(userId);

    const formattedReferees = referees.map((referee) => {
      const { email, plan, referral_date } = referee;

      const trialDay = process.env.NEXT_PUBLIC_REFERRAL_TRIAL_DAYS || '3';
      const isInTrial = dayjs(referral_date)
        .add(+trialDay, 'day')
        .isAfter(dayjs());
      const hasPaidForPro = plan === 'pro' && !isInTrial;

      return {
        email,
        plan,
        referralDate: referral_date,
        isInTrial,
        hasPaidForPro,
      };
    });

    const numberOfPaidUser = formattedReferees.filter(
      (referee) => referee.hasPaidForPro,
    ).length;

    return new Response(
      JSON.stringify({ referees: formattedReferees, numberOfPaidUser }),
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    captureException(error);
    return new Response('Error', { status: 500 });
  }
};

export default wrapApiHandlerWithSentry(
  handler,
  '/api/referral/referees',
);
