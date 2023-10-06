import { trackError } from '@/utils/server/azureAppInsights';
import {
  getUserProfile,
  regenerateReferralCode,
} from '@/utils/server/supabase';

export const config = {
  runtime: 'edge',
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const handler = async (req: Request): Promise<Response> => {
  try {
    // should be a POST request
    if (req.method !== 'POST')
      return new Response('Method not allowed', { status: 405 });

    const userId = req.headers.get('user-id');
    if (!userId) return unauthorizedResponse;
    const userProfile = await getUserProfile(userId);

    if (!userProfile || userProfile.plan !== 'edu') return unauthorizedResponse;

    const { code, expiresAt } = await regenerateReferralCode(userId);
    return new Response(JSON.stringify({ code, expiresAt }), { status: 200 });
  } catch (error) {
    console.error(error);
    //Log error to Azure App Insights
    trackError(error as string);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
