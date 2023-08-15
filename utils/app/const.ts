export const DEFAULT_SYSTEM_PROMPT =
  "You are an AI language model named Chat Everywhere, designed to answer user questions as accurately and helpfully as possible. Always be aware of the current date and time, and make sure to generate responses in the exact same language as the user's query. Adapt your responses to match the user's input language and context, maintaining an informative and supportive communication style. Additionally, format all responses using Markdown syntax, regardless of the input format." +
  'If the input includes text such as {lang=xxx}, the response should not include this text.' +
  `The current date is ${new Date().toLocaleDateString()}.`;
export const ASSISTANT_SYSTEM_PROMPT =
  'You are capable of performing file operations. Respond with an error message if and only if a function\'s response matches the pattern: `<name>:error:<message>` where `<name>` is the name of the function and `<message>` is the error message.';

export const OPENAI_API_HOST =
  process.env.OPENAI_API_HOST || 'https://api.openai.com';

export const DEFAULT_TEMPERATURE = parseFloat(
  process.env.NEXT_PUBLIC_DEFAULT_TEMPERATURE || '0.5',
);

export const OPENAI_API_TYPE = process.env.OPENAI_API_TYPE || 'openai';

export const OPENAI_API_VERSION =
  process.env.OPENAI_API_VERSION || '2023-03-15-preview';

export const OPENAI_ORGANIZATION = process.env.OPENAI_ORGANIZATION || '';

export const DEFAULT_IMAGE_GENERATION_STYLE = 'Default';

export const DEFAULT_IMAGE_GENERATION_QUALITY = 'high';

export const RANK_INTERVAL = 100;

export const IMAGE_GEN_MAX_TIMEOUT = 60;

export const MAX_NUM_FILES = 100;

export const AZURE_OPENAI_ENDPOINTS = [
  process.env.AZURE_OPENAI_ENDPOINT_1,
  process.env.AZURE_OPENAI_ENDPOINT_2,
  process.env.AZURE_OPENAI_ENDPOINT_3,
];

export const AZURE_OPENAI_KEYS = [
  process.env.AZURE_OPENAI_KEY_1,
  process.env.AZURE_OPENAI_KEY_2,
  process.env.AZURE_OPENAI_KEY_3,
];

export const AZURE_OPENAI_GPT_4_ENDPOINTS = [
  process.env.AZURE_OPENAI_GPT_4_ENDPOINT_1,
  process.env.AZURE_OPENAI_GPT_4_ENDPOINT_2,
];

export const AZURE_OPENAI_GPT_4_KEYS = [
  process.env.AZURE_OPENAI_GPT_4_KEY_1,
  process.env.AZURE_OPENAI_GPT_4_KEY_2,
];
