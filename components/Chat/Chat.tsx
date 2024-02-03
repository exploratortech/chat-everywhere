import { IconArrowDown, IconClearAll } from '@tabler/icons-react';
import {
  Fragment,
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

import chat from '@/utils/app/chat';
import { handleImageToPromptSend } from '@/utils/app/image-to-prompt';
import { throttle } from '@/utils/data/throttle';

import { Message } from '@/types/chat';
import { PluginID, Plugins } from '@/types/plugin';

import HomeContext from '@/pages/api/home/home.context';

import { NewConversationMessagesContainer } from '../ConversationStarter/NewConversationMessagesContainer';
import { StoreConversationButton } from '../Spinner/StoreConversationButton';
import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import { ErrorMessageDiv } from './ErrorMessageDiv';
import VirtualList from './VirtualList';

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(
    async (deleteCount = 0, overrideCurrentMessage?: Message) => {
      const message = overrideCurrentMessage || currentMessage;

      if (!message) return;
      const plugin = (message.pluginId && Plugins[message.pluginId]) || null;

      const {
        updateConversation,
        createChatBody,
        sendRequest,
        handleErrorResponse,
        handleNoDataResponse,
        handleDataResponse,
      } = chat;
      if (selectedConversation) {
        const controller = new AbortController();
        const updatedConversation = updateConversation(
          deleteCount,
          message,
          selectedConversation,
          homeDispatch,
        );
        const chatBody = createChatBody(
          updatedConversation,
          plugin,
          selectedConversation,
        );
        const response = await sendRequest(
          chatBody,
          plugin,
          controller,
          outputLanguage,
          user,
        );

        if (!response.ok) {
          handleErrorResponse(
            response,
            selectedConversation,
            homeDispatch,
            toast.error,
            t,
          );
          return;
        }

        const data = response.body;
        if (!data) {
          handleNoDataResponse(homeDispatch);
          return;
        }

        handleDataResponse(
          data,
          updatedConversation,
          plugin,
          message,
          controller,
          selectedConversation,
          conversations,
          stopConversationRef,
          homeDispatch,
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      conversations,
      selectedConversation,
      stopConversationRef,
      outputLanguage,
      currentMessage,
      homeDispatch,
    ],
  );

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
  const onEdit = useCallback(
    (editedMessage: Message, index: number) => {
      setCurrentMessage(editedMessage);

      // discard edited message and the ones that come after then resend
      if (!selectedConversation) return;
      handleSend(selectedConversation?.messages.length - index, editedMessage);
    },
    [handleSend, selectedConversation, setCurrentMessage],
  );

  return (
    <div className="relative flex-1 bg-white dark:bg-[#343541]">
      {modelError ? (
        <ErrorMessageDiv error={modelError} />
      ) : (
        <>
          <div className="max-h-full h-full overflow-x-hidden flex flex-col">
            {selectedConversation?.messages.length === 0 ? (
              <>
                <div className="mx-auto flex max-w-[350px] flex-col space-y-10 pt-12 md:px-4 sm:max-w-[600px] ">
                  <div className="text-center text-3xl font-semibold text-gray-800 dark:text-gray-100">
                    <NewConversationMessagesContainer
                      customInstructionOnClick={(prompt: string) => {
                        // DOING:
                        const message: Message = {
                          role: 'user',
                          content: prompt,
                          pluginId: null,
                        };

                        setCurrentMessage(message);
                        handleSend(0, message);
                      }}
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

                <div className="flex-1">
                  {selectedConversation?.messages && (
                    <VirtualList
                      key={selectedConversation.id}
                      messages={selectedConversation.messages}
                      messageIsStreaming={messageIsStreaming}
                      onEdit={onEdit}
                    />
                  )}
                </div>

                {loading && <ChatLoader />}

                <div
                  className="h-[1px] bg-white dark:bg-[#343541]"
                  ref={messagesEndRef}
                />
              </>
            )}
          </div>

          <ChatInput
            stopConversationRef={stopConversationRef}
            textareaRef={textareaRef}
            onSend={(currentMessage) => {
              handleSend(0, currentMessage);
            }}
            onRegenerate={onRegenerate}
          />
        </>
      )}
    </div>
  );
});
Chat.displayName = 'Chat';
