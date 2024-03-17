import { OpenAIModel } from './openai';
import { PluginID } from './plugin';

export type Prompt = RegularPrompt | CustomInstructionPrompt | TeacherPrompt;
export interface RegularPrompt {
  id: string;
  name: string;
  description: string;
  content: string;
  model: OpenAIModel;
  folderId: string | null;
  lastUpdateAtUTC: number; // timestamp in UTC in milliseconds
  rank: number;
  deleted?: boolean;
  isCustomInstruction?: false;
}
export interface CustomInstructionPrompt
  extends Omit<RegularPrompt, 'isCustomInstruction'> {
  isCustomInstruction: true;
}
export interface TeacherPrompt extends CustomInstructionPrompt {
  is_teacher_prompt: true;
  first_user_message: string;
  default_mode:
    | 'default'
    | PluginID.LANGCHAIN_CHAT
    | PluginID.GPT4
    | PluginID.IMAGE_GEN;
}
export function isRegularPrompt(prompt: Prompt): prompt is RegularPrompt {
  return prompt && !prompt.isCustomInstruction;
}

export function isCustomInstructionPrompt(
  prompt: Prompt,
): prompt is CustomInstructionPrompt {
  return !!(
    'isCustomInstruction' in prompt &&
    prompt.isCustomInstruction &&
    !('is_teacher_prompt' in prompt)
  );
}

export function isTeacherCustomInstructionPrompt(
  prompt: Prompt,
): prompt is TeacherPrompt {
  return !!(
    'isCustomInstruction' in prompt &&
    prompt.isCustomInstruction &&
    'is_teacher_prompt' in prompt
  );
}

export type TeacherPromptForTeacherPortal = Omit<
  TeacherPrompt,
  'folderId' | 'lastUpdateAtUTC' | 'rank' | 'isCustomInstruction' | 'deleted'
> & {
  is_enable: boolean;
};
