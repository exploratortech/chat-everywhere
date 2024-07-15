// NOTE: This file is intended for testing the cancel subscription process.
import { TEST_PAYMENT_USER } from '@/cypress/e2e/account';
import { getHomeUrl } from '@/utils/app/api';
import { getAdminSupabaseClient } from '@/utils/server/supabase';

export const config = {
  runtime: 'edge',
};


const handler = async (req: Request): Promise<Response> => {
  const isProd = process.env.VERCEL_ENV === 'production';

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    if (isProd) {
      return new Response('Not allowed in production', { status: 403 });
    }
    // Get user id from supabase
    const supabase = getAdminSupabaseClient();
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', TEST_PAYMENT_USER.email)
      .single();

    if (!userProfile) return new Response('Test User not found', { status: 404 });

    const fakeCancelProPlanSubscriptionEvent = {
      "data": {
        "object": {}
      },
      "type": "customer.subscription.deleted"
    }


    const response = await fetch(`${getHomeUrl()}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fakeEvent: fakeCancelProPlanSubscriptionEvent,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};


export default handler;
