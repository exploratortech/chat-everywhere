import { Dispatch, MutableRefObject } from 'react';

import { ActionType } from '@/hooks/useCreateReducer';

import { Conversation, Message } from '@/types/chat';
import { PluginID } from '@/types/plugin';

import { HomeInitialState } from '@/components/home/home.state';

import {
  saveConversation,
  saveConversations,
  updateConversationLastUpdatedAtTimeStamp,
} from './conversation';
import {
  removeRedundantTempHtmlString,
  removeTempHtmlString,
} from './htmlStringHandler';
import { removeSecondLastLine } from './ui';

import dayjs from 'dayjs';

interface HandleImageToPromptSendProps {
  imageUrl: string;
  selectedConversation: Conversation;
  conversations: Conversation[];
  homeDispatch: Dispatch<ActionType<HomeInitialState>>;
  stopConversationRef: MutableRefObject<boolean>;
  regenerate?: boolean;
  accessToken: string;
}

export async function handleImageToPromptSend({
  regenerate = false,
  imageUrl,
  selectedConversation,
  conversations,
  homeDispatch,
  stopConversationRef,
  accessToken,
}: HandleImageToPromptSendProps) {
  const newMessage: Message = {
    content: `## Image to prompt \n\n ### Image: \n\n <img id="${PluginID.IMAGE_TO_PROMPT}" src="${imageUrl}" />`,
    role: 'assistant',
    pluginId: PluginID.IMAGE_TO_PROMPT,
  };
  let updatedConversation: Conversation;

  if (regenerate) {
    // remove the previous message from the selected conversation
    updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages.slice(0, -1), newMessage],
    };
  } else {
    updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, newMessage],
    };
  }

  homeDispatch({ field: 'loading', value: true });
  homeDispatch({ field: 'messageIsStreaming', value: true });

  const controller = new AbortController();

  // use the imageUrl to call api (image to text)
  const response = await fetch('/api/image-to-prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'user-token': accessToken,
    },
    signal: controller.signal,
    body: JSON.stringify({
      url: imageUrl,
    }),
  });
  if (!response.ok) {
    homeDispatch({ field: 'loading', value: false });
    homeDispatch({ field: 'messageIsStreaming', value: false });
    throw new Error('Network response was not ok');
  }
  const data = response.body;
  if (!data) {
    homeDispatch({ field: 'loading', value: false });
    homeDispatch({ field: 'messageIsStreaming', value: false });
    return;
  }
  // response is ok, continue
  homeDispatch({ field: 'loading', value: false });
  const reader = data.getReader();
  const decoder = new TextDecoder();
  let done = false;
  let text = '';
  let largeContextResponse = false;
  let showHintForLargeContextResponse = false;
  const originalMessages =
    updatedConversation.messages.length > 0
      ? updatedConversation.messages[updatedConversation.messages.length - 1]
          .content
      : '';
  while (!done) {
    if (stopConversationRef.current === true) {
      controller.abort();
      done = true;
      break;
    }
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    const chunkValue = decoder.decode(value);
    text += chunkValue;

    if (text.includes('[DONE]')) {
      text = text.replace('[DONE]', '');
      done = true;
    }
    if (text.includes('[REMOVE_TEMP_HTML]')) {
      text = removeTempHtmlString(text);
    }

    if (text.includes('[REMOVE_LAST_LINE]')) {
      text = text.replace('[REMOVE_LAST_LINE]', '');
      text = removeSecondLastLine(text);
    }

    const updatedMessages: Message[] = updatedConversation.messages.map(
      (message, index) => {
        if (index === updatedConversation.messages.length - 1) {
          return {
            ...message,
            content:
              removeTempHtmlString(originalMessages) +
              removeRedundantTempHtmlString(text),
            largeContextResponse,
            showHintForLargeContextResponse,
          };
        }
        return message;
      },
    );
    updatedConversation = {
      ...updatedConversation,
      messages: updatedMessages,
      lastUpdateAtUTC: dayjs().valueOf(),
    };
    homeDispatch({
      field: 'selectedConversation',
      value: updatedConversation,
    });
  }
  const updatedConversations: Conversation[] = conversations.map(
    (conversation) => {
      if (conversation.id === selectedConversation.id) {
        return updatedConversation;
      }
      return conversation;
    },
  );
  // If the conversation is new, add it to the list of conversations
  if (
    !updatedConversations.find(
      (conversation) => conversation.id === updatedConversation.id,
    )
  ) {
    updatedConversations.push(updatedConversation);
  }

  if (updatedConversations.length === 0) {
    updatedConversations.push(updatedConversation);
  }
  saveConversation(updatedConversation);

  homeDispatch({ field: 'conversations', value: updatedConversations });
  saveConversations(updatedConversations);

  homeDispatch({ field: 'messageIsStreaming', value: false });
  updateConversationLastUpdatedAtTimeStamp();
}
