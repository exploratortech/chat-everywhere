import { ChatBody, Conversation, Message } from '@/types/chat';
import { Plugin, PluginID } from '@/types/plugin';
import { User } from '@/types/user';

import { getOrGenerateUserId } from '../data/taggingHelper';
import { getEndpoint } from './api';
import {
  DEFAULT_IMAGE_GENERATION_QUALITY,
  DEFAULT_IMAGE_GENERATION_STYLE,
} from './const';

function updateConversation(
  deleteCount: number,
  message: Message,
  selectedConversation: Conversation,
  homeDispatch: Function,
): Conversation {
  let updatedConversation: Conversation;
  if (deleteCount) {
    const updatedMessages = [...selectedConversation.messages];

    for (let i = 0; i < deleteCount; i++) {
      updatedMessages.pop();
    }

    updatedConversation = {
      ...selectedConversation,
      messages: [...updatedMessages, message],
    };
  } else {
    updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, message],
    };
  }
  homeDispatch({
    field: 'selectedConversation',
    value: updatedConversation,
  });
  homeDispatch({ field: 'loading', value: true });
  homeDispatch({ field: 'messageIsStreaming', value: true });

  return updatedConversation;
}

function createChatBody(
  updatedConversation: Conversation,
  plugin: Plugin | null,
  selectedConversation: Conversation,
): ChatBody {
  const chatBody: ChatBody = {
    model: updatedConversation.model,
    messages: updatedConversation.messages,
    prompt: updatedConversation.prompt,
    temperature: updatedConversation.temperature,
  };

  if (plugin?.id === PluginID.IMAGE_GEN) {
    chatBody.imageQuality =
      selectedConversation.imageQuality || DEFAULT_IMAGE_GENERATION_QUALITY;
    chatBody.imageStyle =
      selectedConversation.imageStyle || DEFAULT_IMAGE_GENERATION_STYLE;
  }

  return chatBody;
}

async function sendRequest(
  chatBody: ChatBody,
  plugin: Plugin | null,
  controller: AbortController,
  outputLanguage: string,
  user: User | null,
): Promise<Response> {
  const body = JSON.stringify(chatBody);

  const response = await fetch(getEndpoint(plugin), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Output-Language': outputLanguage,
      'user-token': user?.token || '',
      'user-browser-id': getOrGenerateUserId() || '',
      'user-selected-plugin-id': plugin?.id || '',
    },
    signal: controller.signal,
    body,
  });

  return response;
}

function handleErrorResponse(
  response: Response,
  selectedConversation: Conversation,
  homeDispatch: Function,
  toastError: Function,
  t: Function,
) {
  homeDispatch({ field: 'loading', value: false });
  homeDispatch({ field: 'messageIsStreaming', value: false });
  if (response.status === 429) {
    toastError(
      t(
        'We apologize for the inconvenience, but our server is currently experiencing high traffic. Please try again later.',
      ),
    );
  } else if (response.status === 401) {
    toastError(
      t('Sorry something went wrong. Please refresh the page and try again.'),
    );
  } else {
    toastError(
      t(
        'Sorry, something went wrong. Our team has been notified and will look into it.',
      ),
    );
  }

  // remove the last message from the conversation
  homeDispatch({
    field: 'selectedConversation',
    value: {
      ...selectedConversation,
      messages: [...selectedConversation.messages],
    },
  });
}

function handleNoDataResponse(homeDispatch: Function) {
  homeDispatch({ field: 'loading', value: false });
  homeDispatch({ field: 'messageIsStreaming', value: false });
}

const chat = {
  updateConversation,
  createChatBody,
  sendRequest,
  handleErrorResponse,
  handleNoDataResponse,
};

export default chat;
