import { NextApiRequest, NextApiResponse } from 'next';

import { OpenAIModelID } from '@/types/openai';

import { ChatOpenAI } from 'langchain/chat_models/openai';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { WebBrowser, getText } from 'langchain/tools/webbrowser';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { browserQuery } = req.query;
  const model = new ChatOpenAI({
    temperature: 0,
    modelName: OpenAIModelID.GPT_3_5_16K,
  });
  const embeddings = new OpenAIEmbeddings({});

  console.log('Browser query: ', browserQuery);

  const browser = new WebBrowser({
    model,
    embeddings,
  });

  // Get the HTML of the webpage
  const html = await browser.call(browserQuery as string);

  // Parse the HTML to get the text content
  const content = getText(html, browserQuery as string, false);

  console.log('Output: ', content);

  res.status(200).json({ content });
};

export default handler;
