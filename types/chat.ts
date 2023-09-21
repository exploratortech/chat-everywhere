import { OpenAIModel } from './openai';
import { PluginID } from './plugin';

export interface Message {
  role: Role;
  content: string;
  pluginId:
    | PluginID.LANGCHAIN_CHAT
    | PluginID.GPT4
    | PluginID.IMAGE_GEN
    | PluginID.IMAGE_TO_PROMPT
    | null;
  largeContextResponse?: boolean; // Use to indicate if the response is from a gpt3.5 16k model
  showHintForLargeContextResponse?: boolean; // Use to indicate if the response can be improved by using a gpt3.5 16k model
}

export type Role = 'assistant' | 'user';

export interface ChatBody {
  model: OpenAIModel;
  messages: Message[];
  prompt: string;
  temperature: number;

  // Image generations parameters
  imageStyle?: string;
  imageQuality?: string;
}

export interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  model: OpenAIModel;
  prompt: string;
  temperature: number;
  folderId: string | null;
  lastUpdateAtUTC: number; // timestamp in UTC in milliseconds
  rank: number;
  deleted?: boolean;
  // Image generations parameters
  imageStyle?: string;
  imageQuality?: string;
}
