import { getAdminSupabaseClient } from '@/utils/server/supabase';

import { TEST_PAYMENT_USER } from '@/cypress/e2e/account';

export const config = {
  runtime: 'edge',
};

const handler = async (): Promise<Response> => {
  try {
    const supabase = getAdminSupabaseClient();
    // Reset the test payment user's plan to free
    await supabase
      .from('profiles')
      .update({ plan: 'free' })
      .eq('email', TEST_PAYMENT_USER.email);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
