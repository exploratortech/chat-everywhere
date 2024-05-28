import { OpenAIModels, fallbackModelID } from '@/types/openai';
import { SubscriptionPlan } from '@/types/user';

import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

export const DEFAULT_SYSTEM_PROMPT =
  "You are an AI language model named Chat Everywhere, designed to answer user questions as accurately and helpfully as possible. Always be aware of the current date and time, and make sure to generate responses in the exact same language as the user's query. Adapt your responses to match the user's input language and context, maintaining an informative and supportive communication style. Additionally, format all responses using Markdown syntax, regardless of the input format." +
  'If the input includes text such as [lang=xxx], the response should not include this text.' +
  `The current date is ${new Date().toLocaleDateString()}.`;

export const OPENAI_API_HOST =
  process.env.OPENAI_API_HOST || 'https://api.openai.com';

export const DEFAULT_TEMPERATURE = parseFloat(
  process.env.NEXT_PUBLIC_DEFAULT_TEMPERATURE || '0.5',
);

export const OPENAI_API_TYPE = process.env.OPENAI_API_TYPE || 'openai';

export const OPENAI_API_VERSION =
  process.env.OPENAI_API_VERSION || '2023-12-01-preview';

export const OPENAI_ORGANIZATION = process.env.OPENAI_ORGANIZATION || '';

export const DEFAULT_IMAGE_GENERATION_STYLE = 'Default';

export const DEFAULT_IMAGE_GENERATION_QUALITY = 'high';

export const RANK_INTERVAL = 100;

export const IMAGE_GEN_MAX_TIMEOUT = 300;

export const DEFAULT_REGION = 'icn1';

export const IMAGE_TO_PROMPT_MAX_TIMEOUT = 30;

export const AZURE_OPENAI_ENDPOINTS = [
  process.env.AZURE_OPENAI_ENDPOINT_0,
  process.env.AZURE_OPENAI_ENDPOINT_1,
  process.env.AZURE_OPENAI_ENDPOINT_2,
  process.env.AZURE_OPENAI_ENDPOINT_3,
];

export const AZURE_OPENAI_KEYS = [
  process.env.AZURE_OPENAI_KEY_0,
  process.env.AZURE_OPENAI_KEY_1,
  process.env.AZURE_OPENAI_KEY_2,
  process.env.AZURE_OPENAI_KEY_3,
];

// To be enabled, currently we goes with this order of region regardless of request origin
export const ENDPOINT_TRAFFIC_DISTRIBUTION = [
  0.75, // Japan East
  0.1, // Central US
  0.1, // East US
  0.05, // UK South
];

export const AZURE_OPENAI_GPT_4_ENDPOINTS = [
  process.env.AZURE_OPENAI_GPT_4_ENDPOINT_0,
  process.env.AZURE_OPENAI_GPT_4_ENDPOINT_1,
  process.env.AZURE_OPENAI_GPT_4_ENDPOINT_2,
];

export const AZURE_OPENAI_GPT_4_KEYS = [
  process.env.AZURE_OPENAI_GPT_4_KEY_0,
  process.env.AZURE_OPENAI_GPT_4_KEY_1,
  process.env.AZURE_OPENAI_GPT_4_KEY_2,
];

export const AZURE_DALL_E_3_ENDPOINTS = [
  process.env.AZURE_DALL_E_3_ENDPOINT_0,
  // process.env.AZURE_DALL_E_3_ENDPOINT_1, // RESOURCE NOT FOUND
  process.env.AZURE_DALL_E_3_ENDPOINT_2,
];

export const AZURE_DALL_E_API_KEYS = [
  process.env.AZURE_DALL_E_API_KEY_0,
  // process.env.AZURE_DALL_E_API_KEY_1, // RESOURCE NOT FOUND
  process.env.AZURE_DALL_E_API_KEY_2,
];

export const ERROR_MESSAGES = {
  content_filter_triggered: {
    message: 'Content filter triggered',
    httpCode: 405,
  },
};

export const DEFAULT_FIRST_MESSAGE_TO_GPT =
  'Provide a short welcome message based on your prompt, the role you are playing is based on the prompt';

export const newDefaultConversation = {
  id: uuidv4(),
  name: 'New conversation',
  messages: [],
  model: OpenAIModels[fallbackModelID],
  prompt: DEFAULT_SYSTEM_PROMPT,
  temperature: DEFAULT_TEMPERATURE,
  folderId: null,
  lastUpdateAtUTC: dayjs().valueOf(),
};

export const OrderedSubscriptionPlans: SubscriptionPlan[] = [
  'free',
  'pro',
  'ultra',
  'edu',
];

export const ProPlanPaymentLink =
  process.env.NEXT_PUBLIC_ENV === 'production'
    ? 'https://buy.stripe.com/8wM8Av2DM0u99fWfZ1'
    : 'https://buy.stripe.com/test_4gw4hLcvq52Odt6fYY';

export const UltraPlanPaymentLink =
  process.env.NEXT_PUBLIC_ENV === 'production'
    ? 'https://buy.stripe.com/8wM8Av2DM0u99fWfZ1' // TODO: Update the production link
    : 'https://buy.stripe.com/test_00gcOhbrmgLwbkYdR0';

export const Gpt4CreditPurchaseLinks = {
  '50': 'https://buy.stripe.com/28o03Z0vE3Glak09AJ',
  '150': 'https://buy.stripe.com/cN2dUP6U2dgV0JqcMW',
  '300': 'https://buy.stripe.com/dR6g2Xemu5Otcs83cn',
};
export const AiImageCreditPurchaseLinks = {
  '100': 'https://buy.stripe.com/fZeg2Xdiq4Kp8bS9AT',
  '500': 'https://buy.stripe.com/8wMg2XcemccR2Ry8wQ',
};

export const V2ChatUpgradeLink =
  process.env.NEXT_PUBLIC_ENV === 'production'
    ? 'https://buy.stripe.com/4gw9Ez6U2gt71NudRd'
    : 'https://buy.stripe.com/test_dR68y152Y7aWagUcMU';

// STRIPE CREDIT CODE
export const STRIPE_PLAN_CODE_GPT4_CREDIT = 'GPT4_CREDIT';
export const STRIPE_PLAN_CODE_IMAGE_CREDIT = 'IMAGE_CREDIT';

// STRIPE MONTHLY PLAN CODE
export const STRIPE_PLAN_CODE_MONTHLY_PRO_PLAN_SUBSCRIPTION =
  'monthly_pro_plan_subscription';

// STRIPE ONE TIME PLAN CODE
export const STRIPE_PLAN_CODE_ONE_TIME_PRO_PLAN_FOR_1_MONTH =
  'one_time_pro_plan_for_1_month';
