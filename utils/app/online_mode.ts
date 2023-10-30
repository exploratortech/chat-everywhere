import { trimStringBaseOnTokenLimit, shortenMessagesBaseOnTokenLimit } from '@/utils/server/api';
import fetchWebSummary from '@/utils/server/fetchWebSummary';

import { DynamicTool, GoogleCustomSearch } from 'langchain/tools';

const webBrowser = new DynamicTool({
  name: 'web-browser',
  description:
    'Use this tool to access the content of a website or check if a website contain the information you are looking for. The output of this tool is the Markdown format of the website content. Input must be a valid http URL (including the protocol).',
  func: async (input) => {
    const inputURL = new URL(input);
    const { content } = await fetchWebSummary(inputURL.toString());
    return trimStringBaseOnTokenLimit(content, 1500); // Trim web browser content to 1500 tokens
  },
});

export const tools = [
  new GoogleCustomSearch({
    apiKey: process.env.GOOGLE_API_KEY,
    googleCSEId: process.env.GOOGLE_CSE_ID,
  }),
  webBrowser,
];

interface ToolMapping {
  'google-custom-search': string;
  'web-browser': string;
  [key: string]: string;
}

export const toolNameMapping: ToolMapping = {
  'google-custom-search': 'Google Search',
  'web-browser': 'Web Browser',
};

const normalizeTextAnswer = (text: string) => {
  const mindlogRegex = /```Online \n(.|\n)*```/g;
  return text.replace(mindlogRegex, '').replace('{', '{{').replace('}', '}}');
};

export const normalizePreviousMessages = async (messages: any[]) => {
  const shortenMessages = await shortenMessagesBaseOnTokenLimit('', messages, 8000);
  const normalizedMessages =  shortenMessages.map((message, index) => {
    return `${index + 1}) ${
      message.role === 'assistant' ? 'You' : 'User'
    } ${normalizeTextAnswer(message.content)}`;
  }).join('\n');
  
  return normalizedMessages;
};

export const formatMessage = (message: string): string => {
  // Escapes the curly brackets
  return message.replace(/({)|(})/g, "$1$1$2$2");
};
