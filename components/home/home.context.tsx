import { Dispatch, MutableRefObject, createContext } from 'react';

import { ActionType } from '@/hooks/useCreateReducer';

import { Conversation } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { DragData } from '@/types/drag';
import { FolderType } from '@/types/folder';

import { HomeInitialState } from './home.state';

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
  handleUserLogout: () => void;
  playMessage: (message: string, speechId: string) => void;
  stopPlaying: () => void;
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
