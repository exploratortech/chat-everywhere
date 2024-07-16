import type { UserFile } from './UserFile';
import type { OpenAIModel } from './openai';
import type { PluginID } from './plugin';
import type { Prompt } from './prompt';

export interface Message {
  role: Role;
  content: string;
  name?: string;
  pluginId: PluginID | null;
  largeContextResponse?: boolean; // Use to indicate if the response is from a gpt3.5 16k model
  showHintForLargeContextResponse?: boolean; // Use to indicate if the response can be improved by using a gpt3.5 16k model
  // Google cloud storage objects
  fileList?: UserFile[];
}

export type Role = 'assistant' | 'user' | 'function';

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
  // Custom instructions
  customInstructionPrompt?: Prompt;
}

export interface FunctionCall {
  name: string;
  description: string;
  parameters: any;
}
