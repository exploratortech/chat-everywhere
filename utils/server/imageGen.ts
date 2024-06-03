import { FunctionCall } from '@/types/chat';

import { OPENAI_API_HOST } from '../app/const';

export const translateAndEnhancePrompt = async (prompt: string) => {
  const url = `${OPENAI_API_HOST}/v1/chat/completions`;

  const translateSystemPrompt = `
    Act as an AI image generation expert and a professional translator, follow user's instruction as strictly as possible.
    First determine the prompt's language:
      If the prompt is not in English:
        1. Translate the prompt to English, keeping in mind the context for simplicity
        2. Embellish the translated prompt with additional details for enhanced visual appeal
        3. Make sure your response is solely in English

      if the prompt is in english:
        1. Simply echo the original prompt verbatim
        2. Refrain from making any alterations to the original prompt

    Afterward, called the available function based on the following condition:
      if the prompt is ready to be processed:
        - call the 'generate-image' function with the prompt.
      if there are anything wrong or the prompt is not ready for processing:
        - call the 'error-message' function indicating the errorMessage

    Important to note: you must only called the function with the name 'generate-image' or 'error-message', there is no need to response without calling the function.
    `;
  const functionCallsToSend: FunctionCall[] = [
    {
      name: 'error-message',
      description: 'error message',
      parameters: {
        type: 'object',
        properties: {
          errorMessage: {
            type: 'string',
            description: 'error message',
          },
        },
      },
    },
    {
      name: 'generate-image',
      description: 'generate an image from a prompt',
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'prompt to generate the image. must be in english.',
          },
        },
      },
    },
  ];

  const completionResponse = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_GPT_4_KEY}`,
    },
    method: 'POST',
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.1,
      stream: false,
      functions: functionCallsToSend,
      messages: [
        {
          role: 'system',
          content: translateSystemPrompt,
        },
        {
          role: 'user',
          content: `Prompt: ${prompt}`,
        },
      ],
    }),
  });

  const completionResponseJson = await completionResponse.json();

  console.log('completionResponseJson', JSON.stringify(completionResponseJson));

  if (
    completionResponseJson.error &&
    completionResponseJson.error.code === 'content_filter'
  ) {
    throw new Error('Translate and enhance prompt error', {
      cause: {
        code: completionResponseJson.error.code,
        message:
          'Sorry, our safety system detected unsafe content in your message. Please try again with a different topic.',
      },
    });
  }
  console.log({
    message: completionResponseJson.choices[0].message,
  });
  if (completionResponse.status !== 200) {
    console.log('Image generation failed', completionResponseJson);
    throw new Error('Image generation failed');
  }

  let functionCallResponse =
    completionResponseJson.choices[0].message.function_call;
  if (functionCallResponse) {
    const functionName = functionCallResponse.name;
    const functionParameters = JSON.parse(functionCallResponse.arguments);

    if (functionName === 'error-message') {
      throw new Error('Translate and enhance prompt error', {
        cause: {
          translateAndEnhancePromptErrorMessage:
            functionParameters.errorMessage,
        },
      });
    } else if (functionName === 'generate-image') {
      console.log('resultPrompt', functionParameters.prompt);
      return functionParameters.prompt;
    }
  } else {
    console.log({
      completionResponseJson,
    });
    throw new Error('Translate and enhance prompt error');
  }
};

// TODO: Handle not calling any function
