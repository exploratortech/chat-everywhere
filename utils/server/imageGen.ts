import { OpenAIModelID } from '@/types/openai';

import { OPENAI_API_HOST } from '../app/const';

export const translateAndEnhancePrompt = async (prompt: string) => {
  let url = `${OPENAI_API_HOST}/v1/chat/completions`;

  const isInProductionEnv = process.env.NEXT_PUBLIC_ENV === 'production';
  const translateSystemPrompt = `
    If the prompt is not in English:
      1. Translate the prompt to English, keeping in mind the context for simplicity
      2. Embellish the translated prompt with additional details for enhanced visual appeal
      3. Make sure your response is solely in English 
      4. Provide only your final response, with no accompanying explanation or process 

    If the prompt is in English:
      1. Simply echo the original prompt verbatim
      2. Refrain from making any alterations to the original prompt
      3. Deliver only your final response, devoid of any description or explanation

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
