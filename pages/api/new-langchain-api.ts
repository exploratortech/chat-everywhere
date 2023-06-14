import { NextRequest } from 'next/server';

import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { BingSerpAPI } from 'langchain/tools';
import { Calculator } from 'langchain/tools/calculator';
import { WebBrowser } from 'langchain/tools/webbrowser';

const BingAPIKey = process.env.BingApiKey;
const model = new ChatOpenAI({ modelName: 'gpt-4-0613', temperature: 0 });
const embeddings = new OpenAIEmbeddings();
const tools = [
  new Calculator(),
  new BingSerpAPI(BingAPIKey),
  new WebBrowser({ model, embeddings }),
];

const handler = async (req: NextRequest, res: any) => {
  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: 'openai-functions',
    verbose: true,
  });
  let link = 'https://videomaker.cc/coursesall/aivideomaker02/';
  let input = `將下列網頁内容改寫成課程宣傅影片的分鏡腳本，請用表格列出，包含時間、書面、文字、音樂等 ${link} `;

  // let input = '';
  // input = `這個Page的課程名叫什麼? ${link}}`;

  const result = await executor.call({ input });

  res.json({
    result: JSON.stringify(result, null, 2),
  });
};

export default handler;
