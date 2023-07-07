import { NextRequest, NextResponse } from 'next/server';

import { truncateLogMessage } from '@/utils/server';
import { retrieveUserSessionAndLogUsages } from '@/utils/server/usagesTracking';

import { ChatBody } from '@/types/chat';
import { OpenAIModelID } from '@/types/openai';
import { PluginID } from '@/types/plugin';

import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { Serialized } from 'langchain/dist/load/serializable';
import { BaseChatMessage, LLMResult } from 'langchain/dist/schema';
import { BingSerpAPI, DynamicTool } from 'langchain/tools';
import { all, create } from 'mathjs';

export const config = {
  runtime: 'edge',
};

const calculator = new DynamicTool({
  name: 'calculator',
  description:
    'Useful for getting the result of a math expression. The input to this tool should ONLY be a valid mathematical expression that could be executed by a simple calculator.',
  func: (input) => {
    const math = create(all, {});

    try {
      const value = math.evaluate(input);
      return value.toString();
    } catch (e) {
      return 'Unable to evaluate expression, please make sure it is a valid mathematical expression with no unit';
    }
  },
});

const handler = async (req: NextRequest, res: any) => {
  retrieveUserSessionAndLogUsages(req, PluginID.LANGCHAIN_CHAT);

  const requestBody = (await req.json()) as ChatBody;

  const latestUserPrompt =
    requestBody.messages[requestBody.messages.length - 1].content;

  const selectedOutputLanguage = req.headers.get('Output-Language')
    ? `(lang=${req.headers.get('Output-Language')})`
    : '';

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const writeToStream = async (text: string) => {
    await writer.write(encoder.encode(text));
  };

  const writePluginsActions = async (input: string) => {
    await writeToStream('ONLINE MODE ACTION:' + ` ${input} ` + '\n');
  };

  const webBrowser = (webSummaryEndpoint: string) =>
    new DynamicTool({
      name: 'web-browser',
      description:
        'useful for when you need to find something on or summarize a webpage. input should be a valid http URL (including the protocol)',
      func: async (input) => {
        const requestURL = new URL(webSummaryEndpoint);
        const inputURL = new URL(input);
        console.log('inputURL', inputURL.toString());
        requestURL.searchParams.append('browserQuery', inputURL.toString());
        await writePluginsActions(`Browsing (${input})... \n\n`);
        const response = await fetch(requestURL.toString());
        await writePluginsActions(`Done browsing \n\n`);
        const { content } = await response.json();

        return content;
      },
    });

  const callbackHandlers = {
    handleChainStart: async (chain: any) => {
      console.log('handleChainStart');
      await writer.ready;
      await writePluginsActions('Thinking ... \n\n');
    },
    handleChainEnd: async (outputs: any) => {
      console.log('handleChainEnd', outputs);
    },
    handleAgentAction: async (action: any) => {
      console.log('handleAgentAction', action);
      await writer.ready;
      if (action.log) {
        await writePluginsActions(`${action.log}\n\n`);
      } else if (action.tool && typeof action.tool === 'string') {
        await writePluginsActions(`Using tools ${action.tool} \n\n`);
      }
    },
    handleToolStart: async (tool: any) => {
      console.log('handleToolStart', { tool });
    },
    handleAgentEnd: async (action: any) => {
      console.log('handleAgentEnd', action);
      await writer.ready;
      if (
        action.returnValues.output.includes(
          'Agent stopped due to max iterations.',
        )
      ) {
        await writePluginsActions(
          'Sorry, I ran out of time to think (TnT) Please try again with a more detailed question.',
        );
      }
      await writeToStream('[DONE]');
      console.log('Done');
      writer.close();
    },
    handleChatModelStart: async (
      llm: Serialized,
      messages: BaseChatMessage[][],
      runId: string,
      parentRunId?: string | undefined,
      extraParams?: Record<string, unknown> | undefined,
      tags?: string[] | undefined,
    ) => {
      console.log('handleChatModelStart');
    },
    handleLLMEnd: async (
      output: LLMResult,
      runId: string,
      parentRunId?: string,
    ) => {
      console.log('handleLLMEnd');
    },
    handleToolEnd: async (
      output: string,
      runId: string,
      parentRunId?: string | undefined,
    ) => {
      console.log('handleToolEnd');
    },
    handleText: async (text: string) => {
      console.log('handleText', text);
    },
    handleLLMNewToken: async (token: any) => {
      console.log('handleLLMNewToken', token);
      if (token) {
        await writer.ready;
        await writeToStream(token);
      }
    },
    handleChainError: async (err: any, verbose: any) => {
      await writer.ready;
      // This is a hack to get the output from the LLM
      if (err.message.includes('Could not parse LLM output: ')) {
        await writePluginsActions(err.message);
      } else {
        await writePluginsActions(
          `Sorry, I am not able to answer your question. \n\n`,
        );
        console.log('Chain Error: ', truncateLogMessage(err.message));
      }
      await writer.abort(err);
    },
  };

  const model = new ChatOpenAI({
    temperature: 0,
    modelName: OpenAIModelID.GPT_3_5_16K,
    openAIApiKey: process.env.OPENAI_API_KEY,
    streaming: true,
  });

  const BingAPIKey = process.env.BingApiKey;
  const isHttps = req.headers.get('x-forwarded-proto') === 'https';
  const webSummaryEndpoint = `${isHttps ? 'https' : 'http'}://${req.headers.get(
    'host',
  )}/api/web-summary`;

  const tools = [
    new BingSerpAPI(BingAPIKey),
    calculator,
    webBrowser(webSummaryEndpoint),
  ];

  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: 'openai-functions',
    // verbose: true,
  });

  try {
    executor.verbose = true;

    executor.call(
      {
        input: `${selectedOutputLanguage} Your previous conversations with the user is as follows from oldest to latest, and you can use this information to answer the user's question if needed:
        ${requestBody.messages
          .map((message, index) => {
            return `${index + 1}) ${
              message.role === 'assistant' ? 'You' : 'User'
            } ${normalizeTextAnswer(message.content)}`;
          })
          .join('\n')}

        The current date and time is ${new Date().toLocaleString()}.
        
        Make sure you include the reference links to the websites you used to answer the user's question in your response using Markdown syntax. You MUST use the following Markdown syntax to include a link in your response:
        [Link Text](https://www.example.com)
        
        Let's begin by answering my question below. You can use the information above to answer my question if needed.
        And remember must not overuse the tools i have provided you with, and only use them when needed. Each of the tool can only use up to 3 times per conversation.

        ${latestUserPrompt}`,
      },
      [callbackHandlers],
    );

    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (e) {
    await writer.ready;
    await writePluginsActions(
      'Sorry, I am not able to answer your question. \n\n',
    );
    await writer.abort(e);
    console.log('Request closed');
    console.error(e);
    console.log(typeof e);
  }
};

const normalizeTextAnswer = (text: string) => {
  const mindlogRegex = /```Online \n(.|\n)*```/g;
  return text.replace(mindlogRegex, '').replace('{', '{{').replace('}', '}}');
};

export default handler;
