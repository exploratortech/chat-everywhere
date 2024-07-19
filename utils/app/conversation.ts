import { swapHtmlSegmentByDataIdentifier } from '@/utils/app/htmlStringHandler';

import type { Conversation } from '@/types/chat';
import type { Message } from '@/types/chat';

import dayjs from 'dayjs';

export const getNonDeletedCollection = <T extends { deleted?: boolean }>(
  collection: T[],
): T[] => collection.filter((c) => !c.deleted);

export const updateConversation = (
  updatedConversation: Conversation,
  allConversations: Conversation[],
) => {
  const updatedConversations = allConversations.map((c) => {
    if (c.id === updatedConversation.id) {
      return {
        ...updatedConversation,
        lastUpdateAtUTC: dayjs().valueOf(),
      };
    }

    return c;
  });

  saveConversation(updatedConversation);
  saveConversations(updatedConversations);

  return {
    single: updatedConversation,
    all: updatedConversations,
  };
};

export const updateConversationLastUpdatedAtTimeStamp = () => {
  localStorage.setItem(
    'conversationLastUpdatedAt',
    dayjs().valueOf().toString(),
  );
};

export const saveConversation = (conversation: Conversation) => {
  localStorage.setItem('selectedConversation', JSON.stringify(conversation));
};

export const saveConversations = (conversations: Conversation[]) => {
  localStorage.setItem('conversationHistory', JSON.stringify(conversations));
};

export const savePrompts = (prompts: any[]) => {
  localStorage.setItem('prompts', JSON.stringify(prompts));
};

export async function updateConversationWithNewContent({
  selectedConversation,
  conversations,
  messageIndex,
  homeDispatch,
  newHtml,
}: {
  selectedConversation: Conversation;
  conversations: Conversation[];
  messageIndex: number;
  homeDispatch: Function;
  newHtml: string;
}) {
  const updatedMessages: Message[] = selectedConversation.messages.map(
    (message, index) => {
      if (index === messageIndex) {
        const updatedContent = message.content + newHtml;

        return {
          ...message,
          content: updatedContent || message.content,
        };
      }
      return message;
    },
  );

  updateConversationAndSave({
    selectedConversation,
    conversations,
    updatedMessages,
    homeDispatch,
  });
}

export async function updateConversationWithNewContentByIdentifier({
  selectedConversation,
  conversations,
  messageIndex,
  homeDispatch,
  newHtml,
  targetIdentifier,
}: {
  selectedConversation: Conversation;
  conversations: Conversation[];
  messageIndex: number;
  homeDispatch: Function;
  newHtml: string;
  targetIdentifier: string;
}) {
  const updatedMessages: Message[] = selectedConversation.messages.map(
    (message, index) => {
      if (index === messageIndex) {
        const updatedContent = swapHtmlSegmentByDataIdentifier(
          message.content,
          targetIdentifier,
          newHtml,
        );

        return {
          ...message,
          content: updatedContent || message.content,
        };
      }
      return message;
    },
  );

  updateConversationAndSave({
    selectedConversation,
    conversations,
    updatedMessages,
    homeDispatch,
  });
}

function updateConversationAndSave({
  selectedConversation,
  conversations,
  updatedMessages,
  homeDispatch,
}: {
  selectedConversation: Conversation;
  conversations: Conversation[];
  updatedMessages: Message[];
  homeDispatch: Function;
}) {
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
