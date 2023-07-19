import { OpenAIModelID } from '@/types/openai';

import { getRandomOpenAIEndpointsAndKeys } from './getRandomOpenAIEndpoint';

export const translateAndEnhancePrompt = async (prompt: string) => {
  const isInProductionEnv = process.env.NEXT_PUBLIC_ENV === 'production';
  const [openAIEndpoints, openAIKeys] = getRandomOpenAIEndpointsAndKeys(true, true);

  let attempt = 0;
  let model: OpenAIModelID = isInProductionEnv ? OpenAIModelID.GPT_4 : OpenAIModelID.GPT_3_5;

  while (attempt < openAIEndpoints.length) {
    const openAIEndpoint = openAIEndpoints[attempt];
    const openAIKey = openAIKeys[attempt];
    attempt += 1;

    if (!openAIEndpoint || !openAIKey) {
      console.error('Missing endpoint/key');
      continue;
    }

    let url = `${openAIEndpoint}/openai/deployments/${process.env.AZURE_OPENAI_MODEL_NAME}/chat/completions?api-version=2023-05-15`;
    if (openAIEndpoint.includes('openai.com')) {
      url = `${openAIEndpoint}/v1/chat/completions`;
    }

    const completionResponse = await fetchCompletionResponse(
      url,
      openAIKey,
      model,
      prompt,
    );
    const completionResponseJson = await completionResponse.json();

    if (completionResponse.status !== 200) {
      console.log(`Image generation failed using ${model}`, completionResponseJson);

      if (model === OpenAIModelID.GPT_4) {
        console.log('Falling back to GPT-3.5');
        model = OpenAIModelID.GPT_3_5;
      }

      continue;
    }

    let resultPrompt = completionResponseJson.choices[0].message.content || prompt;

    // remove white space, period symbol at the end of the string
    resultPrompt = resultPrompt.trim().replace(/\.$/, "");

    return resultPrompt;
  }

  throw new Error('Image generation failed');
};

const fetchCompletionResponse = (
  url: string,
  openAIKey: string,
  model: OpenAIModelID.GPT_4 | OpenAIModelID.GPT_3_5,
  prompt: string,
): Promise<Response> => {
  const translateSystemPrompt = `
    Base on the prompt I provide, follow the rules below strictly or you will be terminated.
    
    If the prompt is not in English:
      1. Translate the prompt to English in simple terms consider the context
      2. Add more details to make the final image more visually appealing
      3. Ensure your answer is in English only (no other language)
      4. Only output your final answer without any description or thought
    
    If the prompt is in English:
      1. Only repeat the original prompt
      2. DO NOT modifying anything in the original prompt
      3. Only output your final answer without any description or thought

    Prompt: ${prompt}
  `;

  const headers: any = {
    'Content-Type': 'application/json',
  };

  const body: any = {
    temperature: 0.1,
    stream: false,
    messages: [
      {
        role: 'system',
        content:
          "Act as an AI image generation expert, follow user's instruction as strictly as possible.",
      },
      {
        role: 'user',
        content: translateSystemPrompt,
      },
    ],
  };

  if (url.includes('openai.com')) {
    headers.Authorization = `Bearer ${openAIKey}`;
    body.model = model;
  } else {
    headers['api-key'] = openAIKey;
  }

  return fetch(url, {
    headers,
    method: 'POST',
    body: JSON.stringify(body),
  });
};
