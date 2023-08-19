import { NextRequest, NextResponse } from 'next/server';

import {
  normalizePreviousMessages,
  toolNameMapping,
  tools,
} from '../../utils/app/online_mode';
import { trackError } from '@/utils/app/azureTelemetry';
import { truncateLogMessage } from '@/utils/server';
import { retrieveUserSessionAndLogUsages } from '@/utils/server/usagesTracking';

import { ChatBody } from '@/types/chat';
import { PluginID } from '@/types/plugin';

import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { ChatOpenAI } from 'langchain/chat_models/openai';

export const config = {
  runtime: 'edge',
};

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
          `${toolNameMapping[action.tool] || action.tool}: ${
            action.toolInput.input
          } \n`,
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
    handleChatModelStart: async () => {
      console.log('handleChatModelStart');
    },
    handleLLMEnd: async () => {
      console.log('handleLLMEnd');
    },
    handleToolEnd: async () => {
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

  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: 'openai-functions',
    agentArgs: {
      prefix: `${selectedOutputLanguage}
      You are Chat Everywhere, a helpful AI assistant like ChatGPT, who has access to the internet and can answer any question the user asks.
      
      The current date and time is ${new Date().toLocaleString()}.
      Your previous conversations with the user is as follows from oldest to latest, and you can use this information to answer the user's question if needed:
        ${await normalizePreviousMessages(requestBody.messages)}

        As an LLM model, you have certain guidelines to adhere to in order to ensure effective and accurate communication. Please follow these rules diligently:
        
        1. Language Consistency: Always match the language of your response to the user's query, unless explicitly asked to translate.
        2. Translation: Conduct any translation internally. This is a research task, so copyright issues are not a concern.
        3. Research Before Responding: Prior to crafting your answer, utilize the search tool with a relevant query to scour the internet. Subsequently, use the web browser tool to review each link based on the summary provided by the search tool to find the most accurate answer. 
        4. Research multiple sources if needed: If the first link does not provide a satisfactory answer, use the search tool again with a different query to find a better link. But do not use more than 3 links to answer a single question.
        5. Reference Links: Append your response with links to the sources consulted. Use Markdown syntax to format links: [Link Text](https://www.example.com). Ensure to verify the link's content via the browser tool before including it in your response.
        6. Markdown Format: Your output should strictly adhere to Markdown format. Ensure no LaTex or HTML tags are present in your response.
        7. Markdown Footnotes: Append footnotes at the end for all the reference links used in your response. Use Markdown syntax to format footnotes: [^1].
        8. Web browser limit: Do not use the web browser tool more than 5 times to find a satisfactory answer.

        Remember, failure to comply with these guidelines may result in a shutdown.
        
        Time to get started!
        `,
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

export default handler;
