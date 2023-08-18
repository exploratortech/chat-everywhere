import { trackError } from '@/utils/app/azureTelemetry';
import fetchWebSummary from '@/utils/server/fetchWebSummary';

import { DynamicTool, GoogleCustomSearch } from 'langchain/tools';
import { all, create } from 'mathjs';
import { trimStringBaseOnTokenLimit } from '@/utils/server/api';

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

const webBrowser = new DynamicTool({
  name: 'web-browser',
  description:
    'Use this tool to access the content of a website or check if a website contain the information you are looking for. The output of this tool is the Markdown format of the website content. Input must be a valid http URL (including the protocol).',
  func: async (input) => {
    const inputURL = new URL(input);
    const { content } = await fetchWebSummary(inputURL.toString());
    return trimStringBaseOnTokenLimit(content, 15000); // Trim web browser content to 15000 tokens
  },
});

export const tools = [
  new GoogleCustomSearch({
    apiKey: process.env.GOOGLE_API_KEY,
    googleCSEId: process.env.GOOGLE_CSE_ID,
  }),
  calculator,
  webBrowser,
];

interface ToolMapping {
  'google-custom-search': string;
  calculator: string;
  'web-browser': string;
  [key: string]: string;
}

export const toolNameMapping: ToolMapping = {
  'google-custom-search': 'Google Search',
  calculator: 'Calculator',
  'web-browser': 'Web Browser',
};
