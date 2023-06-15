import { NextApiRequest, NextApiResponse } from 'next';

import { ChatOpenAI } from 'langchain/chat_models/openai';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { WebBrowser } from 'langchain/tools/webbrowser';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { browserQuery } = req.query;
  const model = new ChatOpenAI({
    temperature: 0,
    modelName: 'gpt-3.5-turbo-16k',
  });
  const embeddings = new OpenAIEmbeddings({});

  console.log("Browser query: ", browserQuery);
  
  const browser = new WebBrowser({ 
    model, 
    embeddings,
  });

  const result = await browser.call(browserQuery as string);

  console.log("Output: ", result);

  res.status(200).json({ summary: result });
};

export default handler;
