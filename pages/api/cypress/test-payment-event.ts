import { getHomeUrl } from '@/utils/app/api';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  const isProd = process.env.VERCEL_ENV === 'production';
  try {
    if (isProd) {
      return new Response('Not allowed in production', { status: 403 });
    }
    // read req body (plan: pro/ultra)
    // const body = await req.json();
    // const plan = body.plan;

    const response = await fetch(`${getHomeUrl()}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // TODO: add the correct body for the plan
      // body: JSON.stringify(plan === 'pro' ? fakeProPlanSubscriptionEvent : fakeUltraPlanSubscriptionEvent),
      body: JSON.stringify({ testEvent: fakeProPlanSubscriptionEvent }),
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
      client_reference_id: '5ce53e0d-5298-4180-8f6f-1c5becb99d4c',
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
        email: 'laokameng.6@gmail.com',
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

// TODO: add fake ultra plan subscription event
const fakeUltraPlanSubscriptionEvent = fakeProPlanSubscriptionEvent;

export default handler;
