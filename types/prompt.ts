import { OpenAIModel } from './openai';
import { PluginID } from './plugin';

export interface Prompt {
  id: string;
  name: string;
  description: string;
  content: string;
  model: OpenAIModel;
  folderId: string | null;
  lastUpdateAtUTC: number; // timestamp in UTC in milliseconds
  rank: number;
  isCustomInstruction?: boolean;
  deleted?: boolean;
  is_teacher_prompt?: boolean;
  default_mode?:
    | 'default'
    | PluginID.LANGCHAIN_CHAT
    | PluginID.GPT4
    | PluginID.IMAGE_GEN;
}

export type TeacherPrompt = Omit<
  Prompt,
  'folderId' | 'lastUpdateAtUTC' | 'rank' | 'isCustomInstruction' | 'deleted'
> & {
  is_enable: boolean;
};
