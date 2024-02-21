import { Dispatch, createContext } from "react";

import { ActionType } from "@/hooks/useCreateReducer";

export interface ClearConversationsModalState {
  selectedConversations: Set<string>;
}

export interface ClearConversationsModalContextProps {
  state: ClearConversationsModalState;
  dispatch: Dispatch<ActionType<ClearConversationsModalState>>;
  addConversations: (...ids: string[]) => void;
  removeConversations: (...ids: string[]) => void;
}

const ClearConversationsModalContext = createContext<ClearConversationsModalContextProps>(undefined!);

export default ClearConversationsModalContext;
