import {
  IconCheck,
  IconCopy,
  IconEdit,
  IconRobot,
  IconTrash,
  IconUser,
} from '@tabler/icons-react';
import {
  FC,
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useTranslation } from 'next-i18next';
import { event } from 'nextjs-google-analytics';

import { updateConversation } from '@/utils/app/conversation';
import { getPluginIcon } from '@/utils/app/ui';
import { modifyParagraphs } from '@/utils/data/onlineOutputModifier';

import { Message } from '@/types/chat';
import { PluginID } from '@/types/plugin';

import TokenCounter from './components/TokenCounter';
import HomeContext from '@/components/home/home.context';

import AssistantRespondMessage from './ChatMessage/AssistantRespondMessage';
import { CreditCounter } from './CreditCounter';
import { FeedbackContainer } from './FeedbackContainer';
import { LineShareButton } from './LineShareButton';
import { SpeechButton } from './SpeechButton';
import StudentShareMessageButton from './StudentShareMessageButton';

interface Props {
  message: Message;
  messageIndex: number;
  messageIsStreaming: boolean;
  onEdit?: (editedMessage: Message, index: number) => void;
}

export const ChatMessage: FC<Props> = memo(
  ({ message, onEdit, messageIsStreaming, messageIndex }) => {
    const { t } = useTranslation('chat');
    const { i18n } = useTranslation();

    const {
      state: { isTempUser, selectedConversation, conversations },
      dispatch: homeDispatch,
    } = useContext(HomeContext);
    const isStudentAccount = isTempUser;

    const displayFooterButtons = useMemo(() => {
      if (!selectedConversation) return false;
      return (
        selectedConversation.messages.length - 1 === messageIndex &&
        !messageIsStreaming
      );
    }, [messageIndex, messageIsStreaming, selectedConversation]);

    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [messageContent, setMessageContent] = useState(message.content);
    const [messagedCopied, setMessageCopied] = useState(false);
    const [isOverTokenLimit, setIsOverTokenLimit] = useState(false);
    const [isCloseToTokenLimit, setIsCloseToTokenLimit] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const toggleEditing = () => {
      setIsEditing(!isEditing);
    };

    const handleInputChange = (
      event: React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
      setMessageContent(event.target.value);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'inherit';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    };

    const handleEditMessage = () => {
      if (message.content != messageContent && selectedConversation && onEdit) {
        onEdit({ ...message, content: messageContent }, messageIndex);
      }
      setIsEditing(false);
      event('interaction', {
        category: 'Conversation',
        label: 'Edited message',
      });
    };

    const handleDeleteMessage = () => {
      if (!selectedConversation) return;

      const { messages } = selectedConversation;
      const findIndex = messages.findIndex((elm) => elm === message);

      if (findIndex < 0) return;

      if (
        findIndex < messages.length - 1 &&
        messages[findIndex + 1].role === 'assistant'
      ) {
        messages.splice(findIndex, 2);
      } else {
        messages.splice(findIndex, 1);
      }
      const updatedConversation = {
        ...selectedConversation,
        messages,
      };
      const { single, all } = updateConversation(
        updatedConversation,
        conversations,
      );
      homeDispatch({ field: 'selectedConversation', value: single });
      homeDispatch({ field: 'conversations', value: all });
    };

    // Add a new state for the selected text
    const [selectedText, setSelectedText] = useState('');

    // Method to handle text selection
    useEffect(() => {
      const logSelection = () => {
        const text = window.getSelection()?.toString();
        setSelectedText(text || '');
      };
    
      document.addEventListener('selectionchange', logSelection);
    
      return () => {
        document.removeEventListener('selectionchange', logSelection);
      };
    }, []);

    const handlePressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      setIsTyping(e.nativeEvent.isComposing);
      if (e.key === 'Enter' && !isTyping && !e.shiftKey) {
        e.preventDefault();
        handleEditMessage();
      }
    };

    const copyOnClick = () => {
      if (!navigator.clipboard) return;

      navigator.clipboard.writeText(message.content).then(() => {
        setMessageCopied(true);
        setTimeout(() => {
          setMessageCopied(false);
        }, 2000);
      });
    };

    const large16kModelBadgeOnClick = () => {
      const displayChineseVersion = /^zh/.test(i18n.language);

      homeDispatch({
        field: 'showFeaturePageOnLoad',
        value: !displayChineseVersion
          ? 'c1ff4f2c-d6f0-4482-b756-d222e21c756a'
          : '81631873-a71a-4f77-93c0-c617566fa9a7',
      });
      homeDispatch({
        field: 'showFeaturesModel',
        value: true,
      });
    };

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'inherit';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [isEditing]);

    const CopyButton = ({
      className = '',
      size = 20,
    }: {
      className?: string;
      size?: number;
    }) => {
      if (message.pluginId === PluginID.IMAGE_GEN) return <></>;

      if (messagedCopied) {
        return (
          <IconCheck
            size={size}
            className={` !text-green-500 !dark:text-green-400 h-fit ${className}`}
          />
        );
      } else {
        return (
          <button
            className={`translate-x-[1000px] text-gray-500 hover:text-gray-700 focus:translate-x-0 group-hover:translate-x-0 dark:text-gray-400 dark:hover:text-gray-300 h-fit ${className}`}
            onClick={copyOnClick}
          >
            <IconCopy size={size} />
          </button>
        );
      }
    };

    const formattedMessage = useMemo(
      () => modifyParagraphs(message.content),
      [message.content],
    );

    return (
      <div
        className={`group px-4 ${
          message.role === 'assistant'
            ? 'border-b border-black/10 bg-gray-50 text-gray-800 dark:border-gray-900/50 dark:bg-[#444654] dark:text-gray-100'
            : 'border-b border-black/10 bg-white text-gray-800 dark:border-gray-900/50 dark:bg-[#343541] dark:text-gray-100'
        }`}
        style={{
          overflowWrap: 'anywhere',
        }}
      >
        <div className="relative m-auto flex gap-4 py-4 text-base md:max-w-2xl md:gap-6 md:py-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
          <div className="min-w-[40px] text-center font-bold flex flex-col justify-start flex-wrap content-center">
            {message.role === 'assistant' ? (
              message.pluginId ? (
                getPluginIcon(message.pluginId, 28)
              ) : (
                <div className="flex flex-col justify-center items-center">
                  <IconRobot size={28} />
                  {(message.largeContextResponse ||
                    message.showHintForLargeContextResponse) && (
                    <span
                      onClick={large16kModelBadgeOnClick}
                      className={`px-2 mt-2 cursor-pointer border text-xs font-medium rounded ${
                        message.showHintForLargeContextResponse
                          ? 'text-gray-800 dark:text-gray-400 border-gray-500 line-through'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-gray-700 dark:text-yellow-300 border-yellow-300'
                      }`}
                    >
                      16K
                    </span>
                  )}
                </div>
              )
            ) : (
              <div className="flex flex-col justify-center items-center">
                <IconUser size={30} />
              </div>
            )}
          </div>

          <div className="prose mt-[-2px] w-full dark:prose-invert">
            {message.role === 'user' ? (
              <div className="flex w-full flex-col md:justify-between">
                {isEditing ? (
                  <div
                    className={`flex w-full flex-col relative ${
                      isOverTokenLimit
                        ? 'before:z-0 before:absolute before:border-2 before:border-red-500 before:dark:border-red-600 before:-top-3 before:-bottom-3 before:-inset-3'
                        : ''
                    }`}
                  >
                    <textarea
                      ref={textareaRef}
                      className="relative z-1 w-full resize-none whitespace-pre-wrap border-none dark:bg-[#343541] focus:outline-none"
                      value={messageContent}
                      onChange={handleInputChange}
                      onKeyDown={handlePressEnter}
                      onKeyUp={(e) => setIsTyping(e.nativeEvent.isComposing)}
                      onCompositionStart={() => setIsTyping(true)}
                      onCompositionEnd={() => setIsTyping(false)}
                      style={{
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        lineHeight: 'inherit',
                        padding: '0',
                        margin: '0',
                        overflow: 'hidden',
                      }}
                    />

                    <div className="relative z-1 mt-10 flex justify-center space-x-4">
                      <button
                        className="h-[40px] rounded-md bg-blue-500 px-4 py-1 text-sm font-medium text-white enabled:hover:bg-blue-600 disabled:opacity-50"
                        onClick={handleEditMessage}
                        disabled={
                          messageContent.trim().length <= 0 || isOverTokenLimit
                        }
                      >
                        {t('Save & Submit')}
                      </button>
                      <button
                        className="h-[40px] rounded-md border border-neutral-300 px-4 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        onClick={() => {
                          setMessageContent(message.content);
                          setIsEditing(false);
                        }}
                      >
                        {t('Cancel')}
                      </button>
                    </div>
                    <TokenCounter
                      className={` ${
                        isOverTokenLimit
                          ? '!text-red-500 dark:text-red-600'
                          : ''
                      } ${
                        isCloseToTokenLimit || isOverTokenLimit
                          ? 'visible'
                          : 'invisible'
                      } absolute right-2 bottom-2 text-sm text-neutral-500 dark:text-neutral-400`}
                      value={messageContent}
                      setIsOverLimit={setIsOverTokenLimit}
                      setIsCloseToLimit={setIsCloseToTokenLimit}
                    />
                  </div>
                ) : (
                  <>
                    <div className="prose whitespace-pre-wrap dark:prose-invert">
                      {message.content}
                    </div>
                    {!isEditing && (
                      <div className="flex flex-row items-center mt-3 w-full">
                        <button
                          className={`text-gray-500 hover:!text-gray-300 h-fit mr-2`}
                          onClick={toggleEditing}
                        >
                          <IconEdit size={18} fill="none" />
                        </button>
                        <CopyButton
                          className="translate-x-[unset] !text-gray-500 hover:!text-gray-300 mr-2"
                          size={18}
                        />
                        <button
                          className={`text-gray-500 hover:!text-gray-300 h-fit mr-2`}
                          onClick={handleDeleteMessage}
                        >
                          <IconTrash size={18} />
                        </button>
                        <LineShareButton 
                        messageContent={selectedText !== '' ? selectedText : message.content} 
                        isSelectedText = { selectedText !== '' ? true : false}
                        />
                        {isStudentAccount && (
                          <div className="ml-2 flex items-center">
                            <StudentShareMessageButton
                              messageContent={selectedText !== '' ? selectedText : message.content}
                              isSelectedText = { selectedText !== '' ? true : false}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="flex w-full flex-col md:justify-between">
                <div className="flex flex-row justify-between">
                    <AssistantRespondMessage
                      formattedMessage={formattedMessage}
                      messageIndex={messageIndex}
                      messagePluginId={message.pluginId}
                    />
                  <div className="flex m-1 tablet:hidden">
                    <CopyButton />
                  </div>
                </div>
                <div className="flex flex-row items-center mt-3 w-full justify-between">
                  <div className="flex flex-row items-center">
                    {(message.pluginId === PluginID.GPT4 ||
                      !message.pluginId) && (
                      <SpeechButton inputText={message.content} />
                    )}
                    {displayFooterButtons && selectedConversation && (
                      <>
                        <FeedbackContainer
                          conversation={selectedConversation}
                        />
                        <div className="m-1 hidden tablet:flex">
                          <CopyButton className="translate-x-[unset] !text-gray-500 hover:!text-gray-300" />
                        </div>
                      </>
                    )}
                    {(message.pluginId === PluginID.aiPainter ||
                      message.pluginId === PluginID.GPT4 ||
                      !message.pluginId) &&
                      !messageIsStreaming && (
                        <>
                          <LineShareButton
                            messageContent={selectedText !== '' ? selectedText : message.content}
                            isSelectedText = { selectedText !== '' ? true : false }
                            className="ml-2"
                          />

                          {isStudentAccount && (
                            <StudentShareMessageButton
                              messageContent={selectedText !== '' ? selectedText : message.content}
                              isSelectedText = { selectedText !== '' ? true : false}
                              className="ml-2"
                            />
                          )}
                        </>
                      )}
                  </div>
                  {displayFooterButtons && (
                    <CreditCounter pluginId={message.pluginId} />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);
ChatMessage.displayName = 'ChatMessage';
