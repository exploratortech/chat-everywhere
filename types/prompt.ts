import { OpenAIModel } from './openai';

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
}

export type TeacherPrompt = Omit<
  Prompt,
  'folderId' | 'lastUpdateAtUTC' | 'rank' | 'isCustomInstruction' | 'deleted'
> & {
  is_enable: boolean;
};
