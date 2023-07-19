import { AZURE_OPENAI_ENDPOINTS, AZURE_OPENAI_KEYS, OPENAI_API_HOST } from "../app/const";

// Returns a list of shuffled endpoints and keys. They should be used based
// on their order in the list.
export const getRandomOpenAIEndpointsAndKeys = (
  includeGPT4: boolean = false,
  openAIPriority: boolean,
): [(string | undefined)[], (string | undefined)[]] => {
  const endpoints: (string | undefined)[] = [...AZURE_OPENAI_ENDPOINTS];
  const keys: (string | undefined)[] = [...AZURE_OPENAI_KEYS];

  for (let i = endpoints.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tempEndpoint = endpoints[i];
    const tempKey = keys[i];
    endpoints[i] = endpoints[j];
    keys[i] = keys[j];
    endpoints[j] = tempEndpoint;
    keys[j] = tempKey;
  }

  if (openAIPriority) {
    // Prioritize OpenAI endpoint
    endpoints.splice(0, 0, OPENAI_API_HOST);
    keys.splice(0, 0, process.env.OPENAI_API_KEY);
  } else {
    endpoints.push(OPENAI_API_HOST);
    keys.push(process.env.OPENAI_API_KEY);
  }

  if (includeGPT4) {
    endpoints.splice(0, 0, OPENAI_API_HOST);
    keys.splice(0, 0, process.env.OPENAI_API_GPT_4_KEY);
  }

  return [endpoints, keys];
};
