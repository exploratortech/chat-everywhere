import { OpenAIModelID } from '@/types/openai';

import { ChatOpenAI } from 'langchain/chat_models/openai';
import { HumanChatMessage, SystemChatMessage } from 'langchain/schema';

export async function translateMessageToLanguage(
  message: string,
  languageLocale: string,
) {
  const prompt = `Act as a translator, translate the following message to language of the locale of '${languageLocale}' as accurately as possible.
  If the message is in Markdown format, please translate the message as if it is in plain text.
  If the message is not translatable to the language of the locale, please output the message as is.
  Only output your final answer without any description or thought.
    `;
  const temperatureToUse = 0;

  const chat = new ChatOpenAI({
    modelName: OpenAIModelID.GPT_3_5,
    temperature: temperatureToUse,
    openAIApiKey: process.env.OPENAI_API_KEY,
    streaming: false,
  });
  const response = await chat.call([
    new SystemChatMessage(prompt),
    new HumanChatMessage(message),
  ]);
  return response;
}
