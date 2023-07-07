import { OpenAIModel } from './openai';

export interface Prompt {
  id: string;
  name: string;
  description: string;
  content: string;
  model: OpenAIModel;
  folderId: string | null;
  lastUpdateAtUTC: number; // timestamp in UTC in milliseconds
  rank: number
  deleted?: boolean;
}
