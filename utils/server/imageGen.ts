import { OpenAIModelID } from '@/types/openai';

import { OPENAI_API_HOST } from '../app/const';

export const translateAndEnhancePrompt = async (prompt: string) => {
  let url = `${OPENAI_API_HOST}/v1/chat/completions`;

  const isInProductionEnv = process.env.NEXT_PUBLIC_ENV === 'production';
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

  const completionResponse = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${isInProductionEnv ? process.env.OPENAI_API_GPT_4_KEY : process.env.OPENAI_API_KEY}`,
    },
    method: 'POST',
    body: JSON.stringify({
      model: isInProductionEnv ? OpenAIModelID.GPT_4 : OpenAIModelID.GPT_3_5,
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
    }),
  });

  const completionResponseJson = await completionResponse.json();

  if (completionResponse.status !== 200) {
    console.log('Image generation failed', completionResponseJson);
    throw new Error('Image generation failed');
  }

  let resultPrompt = completionResponseJson.choices[0].message.content || prompt;

  // remove white space, period symbol at the end of the string
  resultPrompt = resultPrompt.trim().replace(/\.$/, "");

  return resultPrompt;
};
