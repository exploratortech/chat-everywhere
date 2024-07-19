import type { Dispatch } from 'react';
import { createContext } from 'react';

import type { ActionType } from '@/hooks/useCreateReducer';

import type { Conversation } from '@/types/chat';
import type { SupportedExportFormats } from '@/types/export';

import type { ChatbarInitialState } from './Chatbar.state';

export interface ChatbarContextProps {
  state: ChatbarInitialState;
  dispatch: Dispatch<ActionType<ChatbarInitialState>>;
  handleDeleteConversation: (conversation: Conversation) => void;
  handleExportData: () => void;
  handleImportConversations: (data: SupportedExportFormats) => void;
}

const ChatbarContext = createContext<ChatbarContextProps>(undefined!);

export default ChatbarContext;
