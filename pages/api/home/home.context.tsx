import { Dispatch, createContext } from 'react';

import { ActionType } from '@/hooks/useCreateReducer';

import { Conversation } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { FolderType } from '@/types/folder';

import { HomeInitialState } from './home.state';
import { DragData } from '@/types/drag';

export interface HomeContextProps {
  state: HomeInitialState;
  dispatch: Dispatch<ActionType<HomeInitialState>>;
  handleNewConversation: () => void;
  handleCreateFolder: (name: string, type: FolderType) => void;
  handleDeleteFolder: (folderId: string) => void;
  handleUpdateFolder: (folderId: string, name: string) => void;
  handleSelectConversation: (conversation: Conversation) => void;
  handleUpdateConversation: (
    conversation: Conversation,
    data: KeyValuePair,
  ) => void;
  handleUserLogout: () => void;
  playMessage: (message: string, speechId: string) => void;
  stopPlaying: () => void;
  toggleChatbar: () => void;
  togglePromptbar: () => void;
  setDragData: (dragData: DragData) => void;
  removeDragData: () => void;
}

const HomeContext = createContext<HomeContextProps>(undefined!);

export default HomeContext;
