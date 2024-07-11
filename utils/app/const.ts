import { OpenAIModels, fallbackModelID } from '@/types/openai';
import { SubscriptionPlan } from '@/types/user';

import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

export {
  STRIPE_PAID_PLAN_LINKS,
  STRIPE_PLAN_CODE_GPT4_CREDIT,
  STRIPE_PLAN_CODE_IMAGE_CREDIT,
  GPT4_CREDIT_PURCHASE_LINKS,
  AI_IMAGE_CREDIT_PURCHASE_LINKS,
  V2_CHAT_UPGRADE_LINK,
} from './stripe/stripe_config';

export const RESPONSE_IN_CHINESE_PROMPT = `Whenever you respond in Chinese, you must respond in Traditional Chinese (繁體中文).`
export const DEFAULT_SYSTEM_PROMPT =
  "You are an AI language model named Chat Everywhere, designed to answer user questions as accurately and helpfully as possible. Always be aware of the current date and time, and make sure to generate responses in the exact same language as the user's query. Adapt your responses to match the user's input language and context, maintaining an informative and supportive communication style. Additionally, format all responses using Markdown syntax, regardless of the input format." +
  'If the input includes text such as [lang=xxx], the response should not include this text.' +
  `The current date is ${new Date().toLocaleDateString()}.`;

export const OPENAI_API_HOST =
  process.env.OPENAI_API_HOST || 'https://api.openai.com';

export const OPENAI_API_KEY =
  process.env.OPENAI_API_GPT_4_KEY || process.env.OPENAI_API_KEY;

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

// TOKEN PER MINUTE
export const AZURE_OPENAI_TPM = [
  Number(process.env.AZURE_OPENAI_TPM_0) || 10,
  Number(process.env.AZURE_OPENAI_TPM_1) || 10,
  Number(process.env.AZURE_OPENAI_TPM_2) || 10,
  Number(process.env.AZURE_OPENAI_TPM_3) || 10,
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

export const AZURE_OPENAI_GPT_4_TPM = [
  Number(process.env.AZURE_OPENAI_GPT_4_TPM_0) || 10,
  Number(process.env.AZURE_OPENAI_GPT_4_TPM_1) || 10,
  Number(process.env.AZURE_OPENAI_GPT_4_TPM_2) || 10,
];

export const AZURE_OPENAI_GPT_4O_ENDPOINTS = [
  process.env.AZURE_OPENAI_GPT_4O_ENDPOINT_0,
];

export const AZURE_OPENAI_GPT_4O_KEYS = [process.env.AZURE_OPENAI_GPT_4O_KEY_0];

export const AZURE_OPENAI_GPT_4O_TPM = [
  Number(process.env.AZURE_OPENAI_GPT_4O_TPM_0) || 10,
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

// Gemini File Upload Constants
// NOTE: https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models
// NOTE:https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/document-understanding

export const MAX_FILE_DROP_COUNT = 10;

export const MAX_PDF_PAGES = 300;

export const MAX_VIDEO_DURATION = 1 * 60 * 60; // 1 hour
export const MAX_AUDIO_DURATION = 8 * 60 * 60; // 8 hours

export const MAX_FILE_SIZE_FOR_UPLOAD = 104857600; // 100 MB in bytes
export const MAX_PDF_SIZE_FOR_UPLOAD = 31457280; // 30 MB in bytes
export const MAX_IMAGE_SIZE_FOR_UPLOAD = 20971520; // 20 MB in bytes
