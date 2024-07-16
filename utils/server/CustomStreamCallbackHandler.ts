import { truncateLogMessage } from '@/utils/server/api';

import { BaseCallbackHandler } from 'langchain/callbacks';
import type {
  AgentAction,
  AgentFinish,
  ChainValues,
} from 'langchain/dist/schema';

export class CustomStreamCallbackHandler extends BaseCallbackHandler {
  name = 'MyCallbackHandler';
  writer: WritableStreamDefaultWriter<any>;
  writeToStream: (text: string) => Promise<void>;

  constructor(
    writer: WritableStreamDefaultWriter<any>,
    writeToStream: (text: string) => Promise<void>,
  ) {
    super();
    this.writer = writer;
    this.writeToStream = writeToStream;
  }

  async handleChainStart() {
    console.log('handleChainStart');
    await this.writer.ready;
    await this.writeToStream('```Online \n');
    await this.writeToStream('Thinking ... \n\n');
  }
  async handleAgentAction(action: AgentAction) {
    console.log('handleAgentAction', action);
    await this.writer.ready;
    await this.writeToStream(`${action.log}\n\n`);
  }

  async handleAgentEnd(action: AgentFinish) {
    console.log('handleAgentEnd', action);
    await this.writer.ready;
    await this.writeToStream('``` \n\n');
    if (
      action.returnValues.output.includes(
        'Agent stopped due to max iterations.',
      )
    ) {
      await this.writeToStream(
        'Sorry, I ran out of time to think (TnT) Please try again with a more detailed question.',
      );
    } else {
      await this.writeToStream(action.returnValues.output);
    }
    await this.writeToStream('[DONE]');
    console.log('Done');
    this.writer.close();
  }

  async handleChainEnd(_output: ChainValues) {
    console.log('handleChainEnd', _output);
  }

  async handleLLMError(e: any) {
    await this.writer.ready;
    await this.writeToStream('``` \n\n');
    await this.writeToStream(
      'Sorry, I am not able to answer your question. \n\n',
    );
    await this.writer.abort(e);
  }
  async handleChainError(err: any) {
    await this.writer.ready;
    await this.writeToStream('``` \n\n');
    // This is a hack to get the output from the LLM
    if (err.message.includes('Could not parse LLM output: ')) {
      const output = err.message.split('Could not parse LLM output: ')[1];
      await this.writeToStream(`${output} \n\n`);
    } else {
      await this.writeToStream(
        `Sorry, I am not able to answer your question. \n\n`,
      );
      console.log('Chain Error: ', truncateLogMessage(err.message));
    }
    await this.writer.abort(err);
  }
  async handleToolError(err: any) {
    console.log('Tool Error: ', truncateLogMessage(err.message));
  }

  async handleToolEnd(output: string) {
    console.log('handleToolEnd', output);
  }

  async handleText(text: string) {
    console.log('handleText', text);
  }
}
