/* eslint-disable prettier/prettier */
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { IconClearAll } from '@tabler/icons-react';
import type { MutableRefObject } from 'react';
import {
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

import { useFetchFileList } from '@/hooks/file/useFetchFileList';
import useCustomInstructionDefaultMode from '@/hooks/useCustomInstructionDefaultMode';

import chat from '@/utils/app/chat';
import { DEFAULT_FIRST_MESSAGE_TO_GPT } from '@/utils/app/const';
import { handleImageToPromptSend } from '@/utils/app/image-to-prompt';
import { throttle } from '@/utils/data/throttle';

import type { Conversation, Message } from '@/types/chat';
import { PluginID, Plugins } from '@/types/plugin';
import type { Prompt } from '@/types/prompt';
import { isTeacherPrompt } from '@/types/prompt';

import HomeContext from '@/components/home/home.context';

import { NewConversationMessagesContainer } from '../ConversationStarter/NewConversationMessagesContainer';
import ChatDragAndDropContainer from '../FileDragDropArea/ChatDragAndDropContainer';
import { useConversation } from '../Hooks/useConversation';
import { StoreConversationButton } from '../Spinner/StoreConversationButton';
import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import CustomInstructionInUseIndicator from './CustomInstructionInUseIndicator';
import { ErrorMessageDiv } from './ErrorMessageDiv';
import ReportBugForTeacherStudentButton from './ReportBugForTeacherStudentButton';
import VirtualList from './VirtualList';

interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}

export const Chat = memo(({ stopConversationRef }: Props) => {
  const { t } = useTranslation('chat');
  const { t: promptT } = useTranslation('prompts');
  const { t: commonT } = useTranslation('common');
  const { data: userFiles } = useFetchFileList();

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

  useConversation();

  const setCurrentMessage = useCallback(
    (message: Message) => {
      homeDispatch({ field: 'currentMessage', value: message });
    },
    [homeDispatch],
  );

  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const supabase = useSupabaseClient();
  const handleSend = useCallback(
    async (
      deleteCount = 0,
      overrideCurrentMessage?: Message,
      customInstructionPrompt?: Prompt,
    ) => {
      const message = overrideCurrentMessage || currentMessage;

      const isCreatingConversationWithCustomInstruction =
        !!customInstructionPrompt;

      if (!message) return;
      const plugin =
        isCreatingConversationWithCustomInstruction &&
        isTeacherPrompt(customInstructionPrompt)
          ? Plugins[customInstructionPrompt.default_mode]
          : (message.pluginId && Plugins[message.pluginId]) || null;

      const {
        addCustomInstructions,
        updateConversation,
        createChatBody,
        sendRequest,
        handleErrorResponse,
        handleNoDataResponse,
        handleDataResponse,
      } = chat;
      if (selectedConversation) {
        let updatedConversation: Conversation = selectedConversation;

        if (isCreatingConversationWithCustomInstruction) {
          updatedConversation = addCustomInstructions(
            customInstructionPrompt,
            updatedConversation,
          );
        }

        const controller = new AbortController();
        updatedConversation = updateConversation(
          deleteCount,
          message,
          updatedConversation,
        );
        homeDispatch({
          field: 'selectedConversation',
          value: updatedConversation,
        });
        homeDispatch({ field: 'loading', value: true });
        homeDispatch({ field: 'messageIsStreaming', value: true });

        const chatBody = createChatBody(
          updatedConversation,
          plugin,
          selectedConversation,
          userFiles,
        );

        const isTeacherPromptConversation =
          updatedConversation.customInstructionPrompt &&
          isTeacherPrompt(updatedConversation.customInstructionPrompt);
        if (
          isCreatingConversationWithCustomInstruction &&
          !isTeacherPromptConversation
        ) {
          selectedConversation.messages.shift();
          updatedConversation.messages.shift();
        }

        const accessToken = (await supabase.auth.getSession())?.data.session
          ?.access_token;

        const response = await sendRequest(
          chatBody,
          plugin,
          controller,
          outputLanguage,
          user,
          accessToken,
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

      supabase.auth.getSession().then((session) => {
        const accessToken = session?.data.session?.access_token;
        if (!accessToken) {
          alert('Please sign in to continue');
          return;
        }

        handleImageToPromptSend({
          regenerate: true,
          conversations,
          selectedConversation,
          homeDispatch,
          imageUrl,
          stopConversationRef,
          accessToken,
        });
      });
      return;
    }

    const overrideMessage =
      selectedConversation?.messages[selectedConversation?.messages.length - 2];

    handleSend(
      2,
      overrideMessage
        ? {
            ...overrideMessage,
            pluginId: currentMessage
              ? currentMessage.pluginId
              : overrideMessage.pluginId,
          }
        : undefined,
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
  const onContinue = useCallback(
    (lastWords: string) => {
      const continueTemplate = `Your response got cut off, because you only have limited response space. Continue writing exactly where you left off. Do not repeat yourself.
Continue from "${lastWords}<your response>"`;

      const message: Message = {
        role: 'user',
        content: continueTemplate,
        pluginId: currentMessage?.pluginId || null,
      };

      setCurrentMessage(message);
      handleSend(0, message);
      event('interaction', {
        category: 'Chat',
        label: 'Continue',
      });
    },
    [currentMessage?.pluginId, handleSend, setCurrentMessage],
  );

  useCustomInstructionDefaultMode(selectedConversation);

  return (
    <div className="relative flex-1 bg-white dark:bg-[#343541]">
      {modelError ? (
        <ErrorMessageDiv error={modelError} />
      ) : (
        <>
          <div className="flex h-full max-h-full flex-col overflow-x-hidden">
            {selectedConversation?.messages.length === 0 ? (
              <>
                <div className="mx-auto flex max-w-[350px] flex-col space-y-10 pt-12 sm:max-w-[600px] md:px-4 ">
                  <div className="text-center text-3xl font-semibold text-gray-800 dark:text-gray-100">
                    <NewConversationMessagesContainer
                      customInstructionOnClick={(
                        customInstructionPrompt: Prompt,
                      ) => {
                        const isTeacherPromptType = isTeacherPrompt(
                          customInstructionPrompt,
                        );
                        const message: Message = isTeacherPromptType
                          ? {
                              role: 'user',
                              content:
                                customInstructionPrompt.first_message_to_gpt,
                              pluginId: customInstructionPrompt.default_mode,
                            }
                          : {
                              role: 'user',
                              content:
                                customInstructionPrompt.content ||
                                promptT(DEFAULT_FIRST_MESSAGE_TO_GPT),
                              pluginId: null,
                            };

                        setCurrentMessage(message);
                        handleSend(0, message, customInstructionPrompt);
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
                  className="sticky top-0 z-10 flex items-center
                  justify-center border border-b-neutral-300 bg-neutral-100 py-2.5 text-sm text-neutral-500 dark:border-none dark:bg-[#444654] dark:text-neutral-200 tablet:hidden"
                >
                  <CustomInstructionInUseIndicator />
                  {selectedConversation?.name}

                  <button
                    className="ml-2 cursor-pointer hover:opacity-50"
                    onClick={onClearAll}
                  >
                    <IconClearAll size={18} />
                  </button>

                  {selectedConversation && (
                    <div className="flex items-center gap-2">
                      <StoreConversationButton
                        conversation={selectedConversation}
                      />
                      <ReportBugForTeacherStudentButton
                        conversation={selectedConversation}
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  {selectedConversation?.messages && (
                    <VirtualList
                      key={selectedConversation.id}
                      messages={selectedConversation.messages}
                      messageIsStreaming={messageIsStreaming}
                      onEdit={onEdit}
                      onContinue={onContinue}
                    />
                  )}
                </div>

                {loading && <ChatLoader />}

                <div
                  className="h-px bg-white dark:bg-[#343541]"
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
      <ChatDragAndDropContainer />
    </div>
  );
});
Chat.displayName = 'Chat';
