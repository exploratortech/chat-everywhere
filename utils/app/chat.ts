import { UserFile } from '@/types/UserFile';
import { ChatBody, Conversation, Message } from '@/types/chat';
import { Plugin, PluginID } from '@/types/plugin';
import { Prompt, isTeacherPrompt } from '@/types/prompt';
import { User } from '@/types/user';

import { getOrGenerateUserId } from '../data/taggingHelper';
import { getEndpoint } from './api';
import {
  DEFAULT_IMAGE_GENERATION_QUALITY,
  DEFAULT_IMAGE_GENERATION_STYLE,
  ERROR_MESSAGES,
} from './const';
import {
  saveConversation,
  saveConversations,
  updateConversationLastUpdatedAtTimeStamp,
} from './conversation';
import {
  removeRedundantTempHtmlString,
  removeTempHtmlString,
} from './htmlStringHandler';
import { reorderItem } from './rank';
import { removeSecondLastLine } from './ui';

import '@formatjs/intl-segmenter/polyfill';
import dayjs from 'dayjs';

function addCustomInstructions(
  prompt: Prompt,
  selectedConversation: Conversation,
) {
  const updatedConversation: Conversation = {
    ...selectedConversation,
    prompt: prompt.content,
    customInstructionPrompt: prompt,
  };

  return updatedConversation;
}
function updateConversation(
  deleteCount: number,
  message: Message,
  selectedConversation: Conversation,
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

  return updatedConversation;
}

function createChatBody(
  updatedConversation: Conversation,
  plugin: Plugin | null,
  selectedConversation: Conversation,
  allExistedUserFiles: UserFile[] | undefined = [],
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

  const isTeacherPromptType =
    selectedConversation.customInstructionPrompt &&
    isTeacherPrompt(selectedConversation.customInstructionPrompt);
  const isAiPainter = plugin?.id === PluginID.aiPainter;

  // Currently, only the teacher prompt has a custom prompt setting for AI painter mode.
  if (isAiPainter && !isTeacherPromptType) {
    chatBody.prompt = '';
  }

  // Filter out the non-existed files
  chatBody.messages = nonExistedFileFilter(
    chatBody.messages,
    allExistedUserFiles,
  );

  return structuredClone(chatBody);
}

function nonExistedFileFilter(
  messages: Message[],
  allExistedUserFiles: UserFile[],
) {
  const existingFileIds = new Set(allExistedUserFiles.map((file) => file.id));

  const filteredMessages = messages.map((message) => {
    if (message.fileList && message.fileList.length > 0) {
      message.fileList = message.fileList.filter((messageFile) =>
        existingFileIds.has(messageFile.id),
      );
    }
    return message;
  });

  return filteredMessages;
}

async function sendRequest(
  chatBody: ChatBody,
  plugin: Plugin | null,
  controller: AbortController,
  outputLanguage: string,
  user: User | null,
  accessToken: string | undefined,
): Promise<Response> {
  const body = formatBody(chatBody, plugin);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Output-Language': outputLanguage,
    'user-browser-id': getOrGenerateUserId() || '',
    'user-selected-plugin-id': plugin?.id || '',
  };

  if (accessToken) {
    headers['user-token'] = accessToken;
  }

  const response = await fetch(getEndpoint(plugin), {
    method: 'POST',
    headers,
    signal: controller.signal,
    body,
  });

  return response;
}

function formatBody(chatBody: ChatBody, plugin: Plugin | null) {
  if (plugin?.id === PluginID.IMAGE_GEN) {
    if (!chatBody.messages || chatBody.messages.length === 0) {
      throw new Error('Chat body is empty');
    }
    return JSON.stringify({
      userPrompt: chatBody.messages[chatBody.messages.length - 1].content,
      imageStyle: chatBody.imageStyle,
      imageQuality: chatBody.imageQuality,
      temperature: chatBody.temperature,
    });
  } else {
    return JSON.stringify(chatBody);
  }
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
  } else if (response.status === 402) {
    toastError(t("You don't have enough credits to use this feature"));
  } else if (
    response.status === ERROR_MESSAGES.content_filter_triggered.httpCode
  ) {
    toastError(
      t(
        'Sorry, our safety system detected unsafe content in your message. Please try again with a different topic.',
      ),
      {
        icon: '⚠️',
      },
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

async function handleDataResponse(
  data: ReadableStream<Uint8Array>,
  updatedConversation: Conversation,
  plugin: Plugin | null,
  message: Message,
  controller: AbortController,
  selectedConversation: Conversation,
  conversations: Conversation[],
  stopConversationRef: React.MutableRefObject<boolean>,
  homeDispatch: Function,
) {
  if (updatedConversation.messages.length < 2) {
    const { content } = message;
    const customName = updatedConversation.customInstructionPrompt
      ? updatedConversation.customInstructionPrompt.name
      : content.length > 30
      ? content.substring(0, 30) + '...'
      : content;
    updatedConversation = {
      ...updatedConversation,
      name: customName,
    };
  }
  homeDispatch({ field: 'loading', value: false });
  const reader = data.getReader();
  const decoder = new TextDecoder();
  let done = false;
  let isFirst = true;
  let text = '';
  let largeContextResponse = false;
  let showHintForLargeContextResponse = false;

  while (!done) {
    if (stopConversationRef.current === true) {
      controller.abort();
      done = true;
      break;
    }
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    const chunkValue = decoder.decode(value, { stream: true });
    text += chunkValue;

    if (text.includes('[DONE]')) {
      text = text.replace(/\[DONE\]/g, '');
      done = true;
    }

    if (text.includes('[16K]')) {
      text = text.replace(/\[16K\]/g, '');
      largeContextResponse = true;
    }

    if (text.includes('[16K-Optional]')) {
      text = text.replace(/\[16K-Optional\]/g, '');
      showHintForLargeContextResponse = true;
    }

    if (text.includes('[REMOVE_TEMP_HTML]')) {
      text = removeTempHtmlString(text);
    }

    if (text.includes('[REMOVE_LAST_LINE]')) {
      text = text.replace(/\[REMOVE_LAST_LINE\]/g, '');
      text = removeSecondLastLine(text);
    }

    // We can use this command to trigger the initial stream of Edge function response
    // so we have more than 25 seconds on Vercel Edge network to wait for response
    if (text.includes('[PLACEHOLDER]')) {
      text = text.replace(/\[PLACEHOLDER\]/g, '');
    }

    if (isFirst) {
      isFirst = false;
      const updatedMessages: Message[] = [
        ...updatedConversation.messages,
        {
          role: 'assistant',
          content: removeRedundantTempHtmlString(text),
          largeContextResponse,
          showHintForLargeContextResponse,
          pluginId: plugin?.id || null,
        },
      ];
      updatedConversation = {
        ...updatedConversation,
        messages: updatedMessages,
        lastUpdateAtUTC: dayjs().valueOf(),
      };
      homeDispatch({
        field: 'selectedConversation',
        value: updatedConversation,
      });
    } else {
      const updatedMessages: Message[] = updatedConversation.messages.map(
        (message, index) => {
          if (index === updatedConversation.messages.length - 1) {
            return {
              ...message,
              content: removeRedundantTempHtmlString(text),
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
  }

  saveConversation(updatedConversation);
  let updatedConversations: Conversation[] = conversations.map(
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
    updatedConversations = reorderItem(
      updatedConversations,
      updatedConversation.id,
      0,
    );
  }

  homeDispatch({ field: 'conversations', value: updatedConversations });
  saveConversations(updatedConversations);
  homeDispatch({ field: 'messageIsStreaming', value: false });

  updateConversationLastUpdatedAtTimeStamp();
}
const chat = {
  addCustomInstructions,
  updateConversation,
  createChatBody,
  sendRequest,
  handleErrorResponse,
  handleNoDataResponse,
  handleDataResponse,
};

export default chat;
