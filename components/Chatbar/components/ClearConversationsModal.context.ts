import type { Dispatch } from 'react';
import { createContext } from 'react';

import type { ActionType } from '@/hooks/useCreateReducer';

export interface ClearConversationsModalState {
  selectedConversations: Set<string>;
  selectedFolders: Set<string>;
  deletingFolders: boolean;
  selectingAll: boolean;
  confirmingDeletion: boolean;
}

export interface ClearConversationsModalContextProps {
  state: ClearConversationsModalState;
  dispatch: Dispatch<ActionType<ClearConversationsModalState>>;
  addConversations: (...ids: string[]) => void;
  removeConversations: (...ids: string[]) => void;
  addFolders: (...ids: string[]) => void;
  removeFolders: (...ids: string[]) => void;
}

const ClearConversationsModalContext =
  createContext<ClearConversationsModalContextProps>(undefined!);

export default ClearConversationsModalContext;
