import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useCallback, useContext } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import {
  saveConversation,
  saveConversations,
  updateConversationLastUpdatedAtTimeStamp,
} from '@/utils/app/conversation';

import { Conversation, Message } from '@/types/chat';

import HomeContext from '@/components/home/home.context';

import dayjs from 'dayjs';

const useRunButtonCommand = () => {
  const { t: commonT } = useTranslation('common');
  const {
    state: { user, selectedConversation, conversations, messageIsStreaming },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const supabase = useSupabaseClient();
  const runButtonCommand = useCallback(
    async (button: string, messageId: string, messageIndex: number) => {
      if (!user) {
        return toast.error(commonT('Please sign in to use ai image feature'));
      }
      const accessToken = (await supabase.auth.getSession()).data.session
        ?.access_token;
      if (!accessToken) {
        return;
      }
      if (!selectedConversation) return;

      const html = await postButtonCommand(button, messageId, accessToken);

      updateConversationWithNewHtml(
        conversations,
        selectedConversation,
        html,
        messageIndex,
        homeDispatch,
      );
    },
    [
      commonT,
      conversations,
      homeDispatch,
      selectedConversation,
      supabase.auth,
      user,
    ],
  );

  return runButtonCommand;
};

export default useRunButtonCommand;

const postButtonCommand = async (
  button: string,
  messageId: string,
  accessToken: string,
) => {
  const response = await fetch(`/api/mj-queue/initBtnCommand`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access-token': accessToken,
    },
    body: JSON.stringify({
      button,
      messageId,
    }),
  });

  if (!response.ok) {
    console.log({
      text: await response.text(),
    });
    throw new Error('Network response was not ok');
  }
  return await response.text();
};

function updateConversationWithNewHtml(
  conversations: Conversation[],
  selectedConversation: Conversation,
  html: string,
  messageIndex: number,
  homeDispatch: Function,
) {
  const updatedMessages: Message[] = selectedConversation.messages.map(
    (message, index) => {
      if (index === messageIndex) {
        return {
          ...message,
          content: message.content + html,
        };
      }
      return message;
    },
  );

  const updatedConversation = {
    ...selectedConversation,
    messages: updatedMessages,
    lastUpdateAtUTC: dayjs().valueOf(),
  };

  const updatedConversations: Conversation[] = conversations.map(
    (conversation) => {
      if (conversation.id === selectedConversation.id) {
        return updatedConversation;
      }
      return conversation;
    },
  );

  homeDispatch({
    field: 'selectedConversation',
    value: updatedConversation,
  });

  saveConversation(updatedConversation);
  homeDispatch({
    field: 'conversations',
    value: updatedConversations,
  });
  saveConversations(updatedConversations);
  updateConversationLastUpdatedAtTimeStamp();
}
