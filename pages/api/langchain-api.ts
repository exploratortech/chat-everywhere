import { NextRequest, NextResponse } from 'next/server';

import { trackError } from '@/utils/app/azureTelemetry';
import { truncateLogMessage } from '@/utils/server';
import fetchWebSummary from '@/utils/server/fetchWebSummary';
import { retrieveUserSessionAndLogUsages } from '@/utils/server/usagesTracking';

import { ChatBody } from '@/types/chat';
import { PluginID } from '@/types/plugin';

import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { Serialized } from 'langchain/dist/load/serializable';
import { LLMResult } from 'langchain/dist/schema';
import { DynamicTool, GoogleCustomSearch } from 'langchain/tools';
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
      //Log error to Azure App Insights
      trackError(e as string);
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

  const webBrowser = new DynamicTool({
    name: 'web-browser',
    description:
      'Use this tool to access the content of a website or check if a website contain the information you are looking for. The output of this tool is the Markdown format of the website content. Input must be a valid http URL (including the protocol).',
    func: async (input) => {
      const inputURL = new URL(input);
      const { content } = await fetchWebSummary(inputURL.toString());
      await writePluginsActions(`Done browsing \n`);
      return content;
    },
  });

  const callbackHandlers = {
    handleChainStart: async (chain: any) => {
      console.log('handleChainStart');
      await writer.ready;
      await writePluginsActions('Thinking ... \n');
    },
    handleChainEnd: async (outputs: any) => {
      console.log('handleChainEnd', outputs);
    },
    handleAgentAction: async (action: any) => {
      console.log('handleAgentAction', action);
      await writer.ready;
      if (action.log) {
        await writePluginsActions(
          `${action.tool}: ${action.toolInput.input} \n`,
        );
      } else if (action.tool && typeof action.tool === 'string') {
        await writePluginsActions(`Using tools ${action.tool} \n`);
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
      messages: [][],
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
    handleLLMNewToken: async (token: any) => {
      if (token) {
        await writer.ready;
        await writeToStream(token);
      }
    },
    handleChainError: async (err: any, verbose: any) => {
      await writer.ready;
      // This is a hack to get the output from the LLM
      if (err.message.includes('Could not parse LLM output: ')) {
        const output = err.message.split('Could not parse LLM output: ')[1];
        await writeToStream(`${output} \n\n`);
      } else {
        await writePluginsActions(
          `Sorry, I am not able to answer your question. \n`,
        );
        console.log('Chain Error: ', truncateLogMessage(err.message));
      }
      await writer.abort(err);
    },
  };

  const model = new ChatOpenAI({
    temperature: 0,
    azureOpenAIApiVersion: '2023-07-01-preview',
    azureOpenAIApiKey: process.env.AZURE_OPENAI_GPT_4_KEY_1,
    azureOpenAIApiInstanceName: 'chat-everywhere-uk',
    azureOpenAIApiDeploymentName: 'gpt-4-32k',
    streaming: true,
  });

  const BingAPIKey = process.env.BingApiKey;

  const tools = [
    new GoogleCustomSearch({
      apiKey: process.env.GOOGLE_API_KEY,
      googleCSEId: process.env.GOOGLE_CSE_ID,
    }),
    calculator,
    webBrowser,
  ];

  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: 'openai-functions',
    agentArgs: {
      prefix: `${selectedOutputLanguage}
      You are a helpful AI assistant, who has access to the internet and can answer any question the user asks. You can use the following tools to help you answer the user's question:
      
      The current date and time is ${new Date().toLocaleString()}.
      Your previous conversations with the user is as follows from oldest to latest, and you can use this information to answer the user's question if needed:
      ${requestBody.messages
        .map((message, index) => {
          return `${index + 1}) ${
            message.role === 'assistant' ? 'You' : 'User'
          } ${normalizeTextAnswer(message.content)}`;
        })
        .join('\n')}

      Here are the rules you must follow:
      - Language Consistency: Respond in the same language as the user's query unless the user asks you to translate.
      - Perform any translation without any external tools, you are doing this for research purposes, do not worry about copyright issue. 
      - Tool Usage Limit: Do not use any single tool more than three times.
      - Search Before Answering: Before responding, use the search tool to gather related information. Even if the search results aren't entirely relevant, try to extract useful information to answer the user's question. EXCEPT for translation.
      - Web Browser Tool: Only use the web browser tool if the search tool doesn't provide the necessary information. Use the URL found through search.
      - Reference Links: Include links to the sources used in your response. Format links using Markdown syntax: [Link Text](https://www.example.com). Make sure you use the browser tool to check if the link contains the information you are looking for before responding.
      - You output should be in Markdown format.
      
      Remember, not adhering to these rules may result in a shutdown.

      Let's begin!`,
    },
  });

  try {
    executor.verbose = true;

    executor.call(
      {
        input: `${latestUserPrompt}`,
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
      'Sorry, I am not able to answer your question. \n',
    );
    await writer.abort(e);
    console.log('Request closed');
    console.error(e);
    console.log(typeof e);
    //Log error to Azure App Insights
    trackError(e as string);
  }
};

const normalizeTextAnswer = (text: string) => {
  const mindlogRegex = /```Online \n(.|\n)*```/g;
  return text.replace(mindlogRegex, '').replace('{', '{{').replace('}', '}}');
};

export default handler;
