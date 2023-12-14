import { IconArrowDown, IconClearAll } from '@tabler/icons-react';
import {
  MutableRefObject,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';

import { useTranslation } from 'next-i18next';
import { event } from 'nextjs-google-analytics/dist/interactions';

import { getEndpoint } from '@/utils/app/api';
import {
  DEFAULT_IMAGE_GENERATION_QUALITY,
  DEFAULT_IMAGE_GENERATION_STYLE,
} from '@/utils/app/const';
import { saveConversation, saveConversations } from '@/utils/app/conversation';
import { updateConversationLastUpdatedAtTimeStamp } from '@/utils/app/conversation';
import {
  removeRedundantTempHtmlString,
  removeTempHtmlString,
} from '@/utils/app/htmlStringHandler';
import { handleImageToPromptSend } from '@/utils/app/image-to-prompt';
import { reorderItem } from '@/utils/app/rank';
import { removeSecondLastLine } from '@/utils/app/ui';
import { getOrGenerateUserId } from '@/utils/data/taggingHelper';
import { throttle } from '@/utils/data/throttle';

import { ChatBody, Conversation, Message } from '@/types/chat';
import { PluginID, Plugins } from '@/types/plugin';

import HomeContext from '@/pages/api/home/home.context';

import { NewConversationMessagesContainer } from '../ConversationStarter/NewConversationMessagesContainer';
import { StoreConversationButton } from '../Spinner/StoreConversationButton';
import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import { ChatMessage } from './ChatMessage';
import { ErrorMessageDiv } from './ErrorMessageDiv';

import dayjs from 'dayjs';

interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}

export const Chat = memo(({ stopConversationRef }: Props) => {
  const { t } = useTranslation('chat');
  const { t: commonT } = useTranslation('common');

  const {
    state: {
      selectedConversation,
      conversations,
      modelError,
      loading,
      user,
      outputLanguage,
      currentMessage,
      messageIsStreaming,
    },
    handleUpdateConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const setCurrentMessage = useCallback(
    (message: Message) => {
      homeDispatch({ field: 'currentMessage', value: message });
    },
    [homeDispatch],
  );

  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true);
  const [showScrollDownButton, setShowScrollDownButton] =
    useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(
    async (deleteCount = 0, overrideCurrentMessage?: Message) => {
      const message = overrideCurrentMessage || currentMessage;

      if (!message) return;
      const plugin = (message.pluginId && Plugins[message.pluginId]) || null;

      if (selectedConversation) {
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
        const chatBody: ChatBody = {
          model: updatedConversation.model,
          messages: updatedConversation.messages,
          prompt: updatedConversation.prompt,
          temperature: updatedConversation.temperature,
        };
        const endpoint = getEndpoint(plugin);

        if (plugin?.id === PluginID.IMAGE_GEN) {
          chatBody.imageQuality =
            selectedConversation.imageQuality ||
            DEFAULT_IMAGE_GENERATION_QUALITY;
          chatBody.imageStyle =
            selectedConversation.imageStyle || DEFAULT_IMAGE_GENERATION_STYLE;
        }

        const body = JSON.stringify(chatBody);
        const controller = new AbortController();
        const response = await fetch(endpoint, {
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
        if (!response.ok) {
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
          if (response.status === 429) {
            toast.error(
              t(
                'We apologize for the inconvenience, but our server is currently experiencing high traffic. Please try again later.',
              ),
            );
          } else if (response.status === 401) {
            toast.error(
              t(
                'Sorry something went wrong. Please refresh the page and try again.',
              ),
            );
          } else {
            toast.error(
              t('Sorry, something went wrong. Our team has been notified and will look into it.')
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
          return;
        }
        const data = response.body;
        if (!data) {
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
          return;
        }

        if (updatedConversation.messages.length === 1) {
          const { content } = message;
          const customName =
            content.length > 30 ? content.substring(0, 30) + '...' : content;
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
          const chunkValue = decoder.decode(value);
          text += chunkValue;

          if (text.includes('[DONE]')) {
            text = text.replace('[DONE]', '');
            done = true;
          }

          if (text.includes('[16K]')) {
            text = text.replace('[16K]', '');
            largeContextResponse = true;
          }

          if (text.includes('[16K-Optional]')) {
            text = text.replace('[16K-Optional]', '');
            showHintForLargeContextResponse = true;
          }

          if (text.includes('[REMOVE_TEMP_HTML]')) {
            text = removeTempHtmlString(text);
          }

          if (text.includes('[REMOVE_LAST_LINE]')) {
            text = text.replace('[REMOVE_LAST_LINE]', '');
            text = removeSecondLastLine(text);
          }

          // We can use this command to trigger the initial stream of Edge function response
          // so we have more than 25 seconds on Vercel Edge network to wait for response
          if (text.includes('[PLACEHOLDER]')) {
            text = text.replace('[PLACEHOLDER]', '');
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
    },
    [
      conversations,
      selectedConversation,
      stopConversationRef,
      outputLanguage,
      currentMessage,
      homeDispatch,
    ],
  );

  const handleScroll = throttle(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const bottomTolerance = 30;

      if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
        setAutoScrollEnabled(false);
        setShowScrollDownButton(true);
      } else {
        setAutoScrollEnabled(true);
        setShowScrollDownButton(false);
      }
    }
  }, 100);

  const handleScrollDown = () => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  const onClearAll = () => {
    if (
      confirm(t<string>('Are you sure you want to clear all messages?')) &&
      selectedConversation
    ) {
      handleUpdateConversation(selectedConversation, {
        key: 'messages',
        value: [],
      });
    }
  };

  const scrollDown = () => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView(true);
    }
  };
  const throttledScrollDown = throttle(scrollDown, 250);

  const onRegenerate = () => {
    const lastIsImageToPrompt =
      selectedConversation?.messages[selectedConversation?.messages.length - 1]
        ?.pluginId === PluginID.IMAGE_TO_PROMPT;

    if (lastIsImageToPrompt) {
      if (!user) {
        toast.error(commonT('Please sign in to use image to prompt feature'));
        return;
      }
      const lastContent =
        selectedConversation?.messages[
          selectedConversation?.messages.length - 1
        ]?.content;
      const imageUrl = lastContent?.match(
        /<img id="image-to-prompt" src="(.*)" \/>/,
      )?.[1];
      if (!imageUrl) {
        toast.error('No image found from previous conversation');
        return;
      }
      handleImageToPromptSend({
        regenerate: true,
        conversations,
        selectedConversation,
        homeDispatch,
        imageUrl,
        stopConversationRef,
        user,
      });
      return;
    }

    handleSend(
      2,
      selectedConversation?.messages[selectedConversation?.messages.length - 2],
    );
  };

  useEffect(() => {
    throttledScrollDown();
  }, [selectedConversation, throttledScrollDown]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAutoScrollEnabled(entry.isIntersecting);
        if (entry.isIntersecting) {
          textareaRef.current?.focus();
        }
      },
      {
        root: null,
        threshold: 0.5,
      },
    );
    const messagesEndElement = messagesEndRef.current;
    if (messagesEndElement) {
      observer.observe(messagesEndElement);
    }
    return () => {
      if (messagesEndElement) {
        observer.unobserve(messagesEndElement);
      }
    };
  }, [messagesEndRef]);

  return (
    <div className="relative flex-1 overflow-hidden bg-white dark:bg-[#343541]">
      {modelError ? (
        <ErrorMessageDiv error={modelError} />
      ) : (
        <>
          <div
            className="max-h-full overflow-x-hidden"
            ref={chatContainerRef}
            onScroll={handleScroll}
          >
            {selectedConversation?.messages.length === 0 ? (
              <>
                <div className="mx-auto flex max-w-[350px] flex-col space-y-10 pt-12 md:px-4 sm:max-w-[600px] ">
                  <div className="text-center text-3xl font-semibold text-gray-800 dark:text-gray-100">
                    <NewConversationMessagesContainer
                      promptOnClick={(prompt: string) => {
                        const message: Message = {
                          role: 'user',
                          content: prompt,
                          pluginId: null,
                        };

                        setCurrentMessage(message);
                        handleSend(0, message);
                        event('interaction', {
                          category: 'Prompt',
                          label: 'Click on sample prompt',
                        });
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div
                  className="justify-center border flex tablet:hidden
                  border-b-neutral-300 bg-neutral-100 py-[0.625rem] text-sm text-neutral-500 dark:border-none dark:bg-[#444654] dark:text-neutral-200 sticky top-0 z-10"
                >
                  {selectedConversation?.name}

                  <button
                    className="ml-2 cursor-pointer hover:opacity-50"
                    onClick={onClearAll}
                  >
                    <IconClearAll size={18} />
                  </button>

                  {selectedConversation && (
                    <StoreConversationButton
                      conversation={selectedConversation}
                    />
                  )}
                </div>

                {selectedConversation?.messages.map((message, index) => (
                  <div key={index}>
                    <ChatMessage
                      key={index}
                      message={message}
                      messageIndex={index}
                      onEdit={(editedMessage) => {
                        setCurrentMessage(editedMessage);
                        // discard edited message and the ones that come after then resend
                        handleSend(
                          selectedConversation?.messages.length - index,
                          editedMessage,
                        );
                      }}
                      displayFooterButtons={
                        selectedConversation.messages.length - 1 === index &&
                        !messageIsStreaming
                      }
                      conversation={selectedConversation}
                    />
                  </div>
                ))}

                {loading && <ChatLoader />}

                <div
                  className="h-[162px] bg-white dark:bg-[#343541]"
                  ref={messagesEndRef}
                />
              </>
            )}
          </div>

          <ChatInput
            stopConversationRef={stopConversationRef}
            textareaRef={textareaRef}
            onSend={() => {
              handleSend(0);
            }}
            onRegenerate={onRegenerate}
          />
        </>
      )}
      {showScrollDownButton && (
        <div className="absolute bottom-0 right-0 mb-4 mr-4 pb-20">
          <button
            className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-gray-700 shadow-md hover:shadow-lg dark:bg-gray-700 dark:text-gray-200"
            onClick={handleScrollDown}
          >
            <IconArrowDown size={18} />
          </button>
        </div>
      )}
    </div>
  );
});
Chat.displayName = 'Chat';
