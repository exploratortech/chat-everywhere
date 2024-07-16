import type { Dispatch, MutableRefObject } from 'react';
import { createContext } from 'react';

import type { ActionType } from '@/hooks/useCreateReducer';

import type { Conversation } from '@/types/chat';
import type { KeyValuePair } from '@/types/data';
import type { DragData } from '@/types/drag';
import type { FolderType } from '@/types/folder';

import type { HomeInitialState } from './home.state';

export interface HomeContextProps {
  state: HomeInitialState;
  dispatch: Dispatch<ActionType<HomeInitialState>>;
  handleNewConversation: (folderId?: string) => void;
  handleCreateFolder: (name: string, type: FolderType) => void;
  handleDeleteFolder: (folderId: string) => void;
  handleUpdateFolder: (folderId: string, name: string) => void;
  handleSelectConversation: (conversation: Conversation) => void;
  handleUpdateConversation: (
    conversation: Conversation,
    data: KeyValuePair,
  ) => void;
  handleCreatePrompt: (folderId?: string | null) => void;
  toggleChatbar: () => void;
  togglePromptbar: () => void;
  setDragData: (dragData: DragData) => void;
  removeDragData: () => void;
  stopConversationRef: MutableRefObject<boolean>;
  startLoadingBar: () => void;
  completeLoadingBar: () => void;
}

const HomeContext = createContext<HomeContextProps>(undefined!);

export default HomeContext;
