import { useContext, useEffect, useRef } from 'react';

import type { Conversation } from '@/types/chat';
import { isTeacherPrompt } from '@/types/prompt';

import HomeContext from '@/components/home/home.context';

const useCustomInstructionDefaultMode = (
  selectedConversation: Conversation | undefined,
) => {
  const {
    state: { currentMessage },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const prevConversationId = useRef<string | undefined>();

  useEffect(() => {
    if (
      selectedConversation?.customInstructionPrompt &&
      isTeacherPrompt(selectedConversation.customInstructionPrompt) &&
      prevConversationId.current !== selectedConversation.id
    ) {
      homeDispatch({
        field: 'currentMessage',
        value: {
          ...currentMessage,
          pluginId: selectedConversation.customInstructionPrompt.default_mode,
        },
      });
      prevConversationId.current = selectedConversation.id;
    }
  }, [homeDispatch, selectedConversation, currentMessage]);
};
export default useCustomInstructionDefaultMode;
