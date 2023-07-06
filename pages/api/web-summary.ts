import { NextApiRequest, NextApiResponse } from 'next';
import { PromptTemplate } from "langchain/prompts";
import { OpenAI } from "langchain/llms";
import { OpenAIModelID } from '@/types/openai';
import { LLMChain } from 'langchain';
const template  =
  `Output a nice format of the content in Markdown based on the input:
  {input} `;
const prompt = new PromptTemplate({
  template: template,
  inputVariables: ["input"],
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { browserQuery } = req.query;
  const url = browserQuery as string;
  const llm = new OpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: OpenAIModelID.GPT_3_5_16K,
  });
  const chain = new LLMChain({ llm, prompt });
  try{

    const endpointHost = "https://asia-east1-chateverywhere-3cf98.cloudfunctions.net/webContent"
    const endpoint = new URL(endpointHost)
    endpoint.searchParams.append("url", url)
    const webContentResponse=  await fetch(endpoint.toString())
    const{content: webMdContent}= await webContentResponse.json()
    const response = await chain.call({ input: webMdContent});

  
    res.status(200).json({
      content: response,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error });
  }
}
