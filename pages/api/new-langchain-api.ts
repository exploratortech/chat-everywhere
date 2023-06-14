import { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';

import { CustomStreamCallbackHandler } from '@/utils/server/CustomStreamCallbackHandler';

import { ChatBody } from '@/types/chat';

import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { BingSerpAPI } from 'langchain/tools';
import { Calculator } from 'langchain/tools/calculator';
import { WebBrowser } from 'langchain/tools/webbrowser';

const BingAPIKey = process.env.BingApiKey;
const embeddings = new OpenAIEmbeddings();

export const config = {
  runtime: 'edge',
};
const handler = async (req: NextRequest, res: any) => {
  // const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // const requestBody = req.body as ChatBody;
  const requestBody = (await req.json()) as ChatBody;

  const input = requestBody.messages[requestBody.messages.length - 1].content;

  const encoder = new TextEncoder();
  const stream = new TransformStream();

  const writer = stream.writable.getWriter();

  const writeToStream = async (text: string) => {
    await writer.write(encoder.encode(text));
  };

  const customHandler = new CustomStreamCallbackHandler(writer, writeToStream);

  const model = new ChatOpenAI({
    modelName: 'gpt-4-0613',
    temperature: 0,
    streaming: false,
    callbacks: [customHandler],
  });
  const tools = [
    new Calculator(),
    new BingSerpAPI(BingAPIKey),
    // new WebBrowser({ model, embeddings }),
  ];

  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: 'zero-shot-react-description',
    verbose: true,
    callbacks: [customHandler],
  });

  try {
    executor.call({ input });
    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (e) {
    await writer.ready;
    await writeToStream('``` \n\n');
    await writeToStream('Sorry, I am not able to answer your question. \n\n');
    await writer.abort(e);
    console.log('Request closed');
    console.error(e);
    console.log(typeof e);
  }
};

export default handler;
