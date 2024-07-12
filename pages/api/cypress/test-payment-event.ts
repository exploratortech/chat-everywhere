import { TEST_PAYMENT_USER } from '@/cypress/e2e/account';
import { getHomeUrl } from '@/utils/app/api';
import { getAdminSupabaseClient } from '@/utils/server/supabase';
import { z } from 'zod';

export const config = {
  runtime: 'edge',
};

const requestSchema = z.object({
  plan: z.enum(['pro', 'ultra'])
});

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

    const fakeProPlanSubscriptionEvent = {
      id: 'evt_1PbZayEEvfd1BzvuIWPC3rOO',
      object: 'event',
      api_version: '2020-08-27',
      created: 1720752748,
      data: {
        object: {
          id: 'cs_test_b1oa9hQjSmRAIY7VADODVvgEsT533JfITznflkeTCh60nBlfFlyvGr8MbJ',
          object: 'checkout.session',
          after_expiration: null,
          allow_promotion_codes: true,
          amount_subtotal: 999,
          amount_total: 999,
          automatic_tax: {
            enabled: false,
            liability: null,
            status: null,
          },
          billing_address_collection: 'auto',
          cancel_url: 'https://stripe.com',
          client_reference_id: userProfile.id,
          client_secret: null,
          consent: null,
          consent_collection: {
            payment_method_reuse_agreement: null,
            promotions: 'none',
            terms_of_service: 'none',
          },
          created: 1720752727,
          currency: 'usd',
          currency_conversion: null,
          custom_fields: [],
          custom_text: {
            after_submit: null,
            shipping_address: null,
            submit: null,
            terms_of_service_acceptance: null,
          },
          customer: 'cus_QSUavMdAX9Zdp3',
          customer_creation: 'if_required',
          customer_details: {
            address: {
              city: null,
              country: 'MO',
              line1: null,
              line2: null,
              postal_code: null,
              state: null,
            },
            email: TEST_PAYMENT_USER.email,
            name: 'StripeCardTest',
            phone: null,
            tax_exempt: 'none',
            tax_ids: [],
          },
          customer_email: null,
          expires_at: 1720839127,
          invoice: 'in_1PbZaqEEvfd1Bzvut22eUx6c',
          invoice_creation: null,
          livemode: false,
          locale: 'auto',
          metadata: {
            plan_code: 'MONTHLY_PRO_PLAN_SUBSCRIPTION',
          },
          mode: 'subscription',
          payment_intent: null,
          payment_link: 'plink_1N09fvEEvfd1Bzvu8RHD78kb',
          payment_method_collection: 'always',
          payment_method_configuration_details: {
            id: 'pmc_1MzuEJEEvfd1BzvuSIHOnamP',
            parent: null,
          },
          payment_method_options: {
            card: {
              request_three_d_secure: 'automatic',
            },
          },
          payment_method_types: ['card', 'link'],
          payment_status: 'paid',
          phone_number_collection: {
            enabled: false,
          },
          recovered_from: null,
          saved_payment_method_options: {
            allow_redisplay_filters: ['always'],
            payment_method_remove: null,
            payment_method_save: null,
          },
          setup_intent: null,
          shipping: null,
          shipping_address_collection: null,
          shipping_options: [],
          shipping_rate: null,
          status: 'complete',
          submit_type: 'auto',
          subscription: 'sub_1PbZaqEEvfd1BzvunkVi2BBG',
          success_url: 'https://stripe.com',
          total_details: {
            amount_discount: 0,
            amount_shipping: 0,
            amount_tax: 0,
          },
          ui_mode: 'hosted',
          url: null,
        },
      },
      livemode: false,
      pending_webhooks: 4,
      request: {
        id: null,
        idempotency_key: null,
      },
      type: 'checkout.session.completed',
    };


    const fakeUltraPlanSubscriptionEvent = {
      "id": "evt_1Pbb50EEvfd1Bzvu6cO2Pg6O",
      "object": "event",
      "api_version": "2020-08-27",
      "created": 1720758454,
      "data": {
        "object": {
          "id": "cs_test_a1OykWFuJxe6mR80M6mmm73ENFnZ8VJ2cDyrpxEXIzp74uVQtaRwDRMr7n",
          "object": "checkout.session",
          "after_expiration": null,
          "allow_promotion_codes": false,
          "amount_subtotal": 2999,
          "amount_total": 2999,
          "automatic_tax": {
            "enabled": false,
            "liability": null,
            "status": null
          },
          "billing_address_collection": "auto",
          "cancel_url": "https://stripe.com",
          "client_reference_id": userProfile.id,
          "client_secret": null,
          "consent": null,
          "consent_collection": {
            "payment_method_reuse_agreement": null,
            "promotions": "none",
            "terms_of_service": "none"
          },
          "created": 1720758430,
          "currency": "usd",
          "currency_conversion": null,
          "custom_fields": [],
          "custom_text": {
            "after_submit": null,
            "shipping_address": null,
            "submit": null,
            "terms_of_service_acceptance": null
          },
          "customer": "cus_QSW7Jm6qEisEf2",
          "customer_creation": "if_required",
          "customer_details": {
            "address": {
              "city": null,
              "country": "MO",
              "line1": null,
              "line2": null,
              "postal_code": null,
              "state": null
            },
            "email": TEST_PAYMENT_USER.email,
            "name": "StripeCardTest",
            "phone": null,
            "tax_exempt": "none",
            "tax_ids": []
          },
          "customer_email": null,
          "expires_at": 1720844830,
          "invoice": "in_1Pbb4tEEvfd1BzvueDlUtXzd",
          "invoice_creation": null,
          "livemode": false,
          "locale": "auto",
          "metadata": {
            "plan_code": "monthly_ultra_plan_subscription"
          },
          "mode": "subscription",
          "payment_intent": null,
          "payment_link": "plink_1PLhmVEEvfd1BzvuRYKzYTER",
          "payment_method_collection": "always",
          "payment_method_configuration_details": {
            "id": "pmc_1MzuEJEEvfd1BzvuSIHOnamP",
            "parent": null
          },
          "payment_method_options": {
            "card": {
              "request_three_d_secure": "automatic"
            }
          },
          "payment_method_types": [
            "card",
            "link"
          ],
          "payment_status": "paid",
          "phone_number_collection": {
            "enabled": false
          },
          "recovered_from": null,
          "saved_payment_method_options": {
            "allow_redisplay_filters": [
              "always"
            ],
            "payment_method_remove": null,
            "payment_method_save": null
          },
          "setup_intent": null,
          "shipping": null,
          "shipping_address_collection": null,
          "shipping_options": [],
          "shipping_rate": null,
          "status": "complete",
          "submit_type": "auto",
          "subscription": "sub_1Pbb4tEEvfd1BzvuNYGOFJLD",
          "success_url": "https://stripe.com",
          "total_details": {
            "amount_discount": 0,
            "amount_shipping": 0,
            "amount_tax": 0
          },
          "ui_mode": "hosted",
          "url": null
        }
      },
      "livemode": false,
      "pending_webhooks": 4,
      "request": {
        "id": null,
        "idempotency_key": null
      },
      "type": "checkout.session.completed"
    }

    // read req body (plan: pro/ultra)
    const body = await req.json();
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response('Invalid request body. Plan must be either "pro" or "ultra".', { status: 400 });
    }

    const { plan } = validationResult.data;

    if (!plan) {
      throw new Error('Missing plan in the request body');
    }
    const response = await fetch(`${getHomeUrl()}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fakeEvent: plan === 'pro' ? fakeProPlanSubscriptionEvent : fakeUltraPlanSubscriptionEvent,
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
