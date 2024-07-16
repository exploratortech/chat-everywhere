import type { Dispatch } from 'react';
import { createContext } from 'react';

import type { ActionType } from '@/hooks/useCreateReducer';

import type { Prompt } from '@/types/prompt';

import type { PromptbarInitialState } from './Promptbar.state';

export interface PromptbarContextProps {
  state: PromptbarInitialState;
  dispatch: Dispatch<ActionType<PromptbarInitialState>>;
  handleDeletePrompt: (prompt: Prompt) => void;
  handleUpdatePrompt: (prompt: Prompt) => void;
}

const PromptbarContext = createContext<PromptbarContextProps>(undefined!);

export default PromptbarContext;
