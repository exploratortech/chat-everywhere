import { IconPlayerStop, IconRepeat, IconSend } from '@tabler/icons-react';
import {
  KeyboardEvent,
  MutableRefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Tooltip } from 'react-tooltip';

import { useTranslation } from 'next-i18next';

import useDisplayAttribute from '@/hooks/useDisplayAttribute';
import useFocusHandler from '@/hooks/useFocusInputHandler';
import useLimiter from '@/hooks/useLimiter';

import { getNonDeletedCollection } from '@/utils/app/conversation';
import { getPluginIcon } from '@/utils/app/ui';

import { PluginID } from '@/types/plugin';
import { Prompt } from '@/types/prompt';

import HomeContext from '@/pages/api/home/home.context';

import TokenCounter from './components/TokenCounter';

import EnhancedMenu from '../EnhancedMenu/EnhancedMenu';
import VoiceInputButton from '../VoiceInput/VoiceInputButton';
import CircularProgress from './CircularProgress';
import { PromptList } from './PromptList';
import { VariableModal } from './VariableModal';

interface Props {
  onSend: () => void;
  onRegenerate: () => void;
  stopConversationRef: MutableRefObject<boolean>;
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>;
}

export const ChatInput = ({
  onSend,
  onRegenerate,
  stopConversationRef,
  textareaRef,
}: Props) => {
  const { t } = useTranslation('chat');

  const {
    state: {
      selectedConversation,
      messageIsStreaming,
      prompts: originalPrompts,
      currentMessage,
      speechContent,
      isSpeechRecognitionActive,
      user,
    },

    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [content, setContent] = useState<string>();
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showPromptList, setShowPromptList] = useState(false);
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const promptListRef = useRef<HTMLUListElement | null>(null);

  const { isFocused, setIsFocused, menuRef } = useFocusHandler(textareaRef);
  const [isOverTokenLimit, setIsOverTokenLimit] = useState(false);
  const [isCloseToTokenLimit, setIsCloseToTokenLimit] = useState(false);

  const prompts = useMemo(() => {
    return getNonDeletedCollection(originalPrompts);
  }, [originalPrompts]);

  const filteredPrompts = prompts.filter((prompt) =>
    prompt.name.toLowerCase().includes(promptInputValue.toLowerCase()),
  );

  const enhancedMenuDisplayValue = useDisplayAttribute(menuRef);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isSpeechRecognitionActive) {
      e.preventDefault();
      return;
    }
    const value = e.target.value;

    setContent(value);
    updatePromptListVisibility(value);
  };

  const limiterToolTip = useMemo(() => {
    const isFreeUser = user && user.plan === 'free';
    if (isFreeUser) {
      return (
        t('Upgrade to the Pro version to eliminate the cooldown period.') || ''
      );
    }
    return t('Register to decrease the cooldown time.') || '';
  }, [t, user]);

  const { intervalRemaining, setIntervalRemaining, maxInterval } = useLimiter(
    user,
    messageIsStreaming,
  );

  const handleSend = () => {
    if (intervalRemaining > 0) {
      return;
    }
    if (messageIsStreaming || isSpeechRecognitionActive) {
      return;
    }

    if (!content) {
      alert(t('Please enter a message'));
      return;
    }

    if (isOverTokenLimit) {
      return;
    }

    onSend();
    setContent('');

    if (window.innerWidth < 640 && textareaRef && textareaRef.current) {
      textareaRef.current.blur();
    }
  };

  const handleStopConversation = () => {
    stopConversationRef.current = true;
    setTimeout(() => {
      stopConversationRef.current = false;
    }, 1000);
  };

  const isMobile = () => {
    const userAgent =
      typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
    return mobileRegex.test(userAgent);
  };

  const handleInitModal = () => {
    const selectedPrompt = filteredPrompts[activePromptIndex];
    if (selectedPrompt) {
      setContent((prevContent) => {
        const newContent = prevContent?.replace(
          /\/\w*$/,
          selectedPrompt.content,
        );
        return newContent;
      });
      handlePromptSelect(selectedPrompt);
    }
    setShowPromptList(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    setIsTyping(e.nativeEvent.isComposing);
    if (showPromptList) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : prevIndex,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : prevIndex,
        );
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : 0,
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleInitModal();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowPromptList(false);
      } else {
        setActivePromptIndex(0);
      }
    } else if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === '/' && e.metaKey) {
      e.preventDefault();
    }
  };

  const parseVariables = (content: string) => {
    const regex = /{{(.*?)}}/g;
    const foundVariables = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      foundVariables.push(match[1]);
    }

    return foundVariables;
  };

  const updatePromptListVisibility = useCallback((text: string) => {
    const match = text.match(/\/\w*$/);

    if (match) {
      setShowPromptList(true);
      setPromptInputValue(match[0].slice(1));
    } else {
      setShowPromptList(false);
      setPromptInputValue('');
    }
  }, []);

  const handlePromptSelect = (prompt: Prompt) => {
    const parsedVariables = parseVariables(prompt.content);
    setVariables(parsedVariables);

    if (parsedVariables.length > 0) {
      setIsModalVisible(true);
    } else {
      setContent((prevContent) => {
        const updatedContent = prevContent?.replace(/\/\w*$/, prompt.content);
        return updatedContent;
      });
      updatePromptListVisibility(prompt.content);
    }
  };

  const handleSubmit = (updatedVariables: string[]) => {
    const newContent = content?.replace(/{{(.*?)}}/g, (match, variable) => {
      const index = variables.indexOf(variable);
      return updatedVariables[index];
    });

    setContent(newContent);

    if (textareaRef && textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  useEffect(() => {
    if (promptListRef.current) {
      promptListRef.current.scrollTop = activePromptIndex * 30;
    }
  }, [activePromptIndex]);

  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current?.scrollHeight}px`;
      textareaRef.current.style.overflow = `${
        textareaRef?.current?.scrollHeight > 400 ? 'auto' : 'hidden'
      }`;
    }

    homeDispatch({
      field: 'currentMessage',
      value: {
        ...currentMessage,
        role: 'user',
        content,
      },
    });
  }, [content]);

  useEffect(() => {
    homeDispatch({
      field: 'currentMessage',
      value: {
        ...currentMessage,
        pluginId: null,
      },
    });
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        promptListRef.current &&
        !promptListRef.current.contains(e.target as Node)
      ) {
        setShowPromptList(false);
      }
    };

    window.addEventListener('click', handleOutsideClick);

    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    setContent(speechContent);
  }, [speechContent]);

  const isAiImagePluginSelected = useMemo(
    () => currentMessage?.pluginId === PluginID.IMAGE_GEN,
    [currentMessage?.pluginId],
  );

  return (
    <div className="absolute bottom-0 left-0 w-full border-transparent bg-gradient-to-b from-transparent via-white to-white pt-6 dark:border-white/20 dark:via-[#343541] dark:to-[#343541] md:pt-2">
      <div
        className={` ${
          enhancedMenuDisplayValue === 'none'
            ? 'mt-[1.5rem] md:mt-[3rem]'
            : `${
                isAiImagePluginSelected
                  ? 'mt-[16.9rem] md:mt-[12.8rem]'
                  : 'mt-[14rem] md:mt-[10rem]'
              }`
        } stretch mx-2 mt-4 mb-4 flex flex-row gap-3 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-3xl transition-all ease-in-out`}
      >
        {/* Disable stop generating button for image generation until implemented */}
        {messageIsStreaming &&
          currentMessage?.pluginId !== PluginID.IMAGE_GEN && (
            <button
              className="absolute top-0 left-0 right-0 mx-auto mb-3 flex w-fit items-center gap-3 rounded border border-neutral-200 bg-white py-2 px-4 text-black hover:opacity-50 dark:border-neutral-600 dark:bg-[#343541] dark:text-white md:mb-0 md:mt-2"
              onClick={handleStopConversation}
            >
              <IconPlayerStop size={16} /> {t('Stop Generating')}
            </button>
          )}

        {!messageIsStreaming &&
          selectedConversation &&
          selectedConversation.messages.length > 0 && (
            <button
              className="absolute top-0 left-0 right-0 mx-auto mb-3 flex w-fit items-center gap-3 rounded border border-neutral-200 bg-white py-2 px-4 text-black hover:opacity-50 dark:border-neutral-600 dark:bg-[#343541] dark:text-white md:mb-0 md:mt-2 disabled:opacity-25"
              onClick={() => onRegenerate()}
              disabled={intervalRemaining > 0}
            >
              <IconRepeat size={16} /> {t('Regenerate response')}
            </button>
          )}

        <div
          className={`relative mx-2 flex w-full flex-grow flex-col rounded-md 
            border bg-white shadow-[0_0_10px_rgba(0,0,0,0.10)] 
            dark:bg-[#40414F] dark:text-white 
            dark:shadow-[0_0_15px_rgba(0,0,0,0.10)] sm:mx-4 
            ${
              isOverTokenLimit && !isSpeechRecognitionActive
                ? '!border-red-500 dark:!border-red-600'
                : ''
            }
            ${
              !currentMessage || currentMessage.pluginId === null
                ? 'border-black/10 dark:border-gray-900/50'
                : 'border-blue-800 dark:border-blue-700'
            }
          `}
        >
          <EnhancedMenu
            ref={menuRef}
            isFocused={isFocused}
            setIsFocused={setIsFocused}
          />

          <div className="flex items-start">
            <div className="flex items-center pt-1 pl-1">
              <VoiceInputButton />
              <button className="rounded-sm p-1 text-zinc-500 dark:text-zinc-400 cursor-default">
                {getPluginIcon(currentMessage?.pluginId)}
              </button>
            </div>

            <textarea
              ref={textareaRef}
              className={`
                m-0 w-full resize-none bg-transparent pt-3 pr-8 pl-2 bg-white text-black dark:bg-[#40414F] dark:text-white outline-none rounded-md
                ${
                  isSpeechRecognitionActive
                    ? 'z-[1100] pointer-events-none'
                    : ''
                }
                ${
                  isOverTokenLimit && isSpeechRecognitionActive
                    ? 'border !border-red-500 dark:!border-red-600'
                    : 'border-0'
                }
              `}
              style={{
                paddingBottom: `${
                  isCloseToTokenLimit || isOverTokenLimit ? '2.2' : '0.75'
                }rem `,
                resize: 'none',
                bottom: `${textareaRef?.current?.scrollHeight}px`,
                maxHeight: '400px',
                overflow: `${
                  textareaRef.current && textareaRef.current.scrollHeight > 400
                    ? 'auto'
                    : 'hidden'
                }`,
              }}
              placeholder={t('Type a message ...') || ''}
              value={content}
              rows={1}
              onKeyUp={(e) => setIsTyping(e.nativeEvent.isComposing)}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
            />
          </div>

          <TokenCounter
            className={`
              ${isOverTokenLimit ? '!text-red-500 dark:text-red-600' : ''}
              ${
                isCloseToTokenLimit || isOverTokenLimit
                  ? 'visible'
                  : 'invisible'
              }
              ${isSpeechRecognitionActive ? 'z-[1100] pointer-events-none' : ''}
              absolute right-2 bottom-2 text-sm text-neutral-500 dark:text-neutral-400
            `}
            value={content}
            setIsOverLimit={setIsOverTokenLimit}
            setIsCloseToLimit={setIsCloseToTokenLimit}
          />

          {intervalRemaining > 0 ? (
            <>
              <Tooltip
                anchorSelect="#limiter-tooltip"
                content={limiterToolTip}
              />
              <button
                id="limiter-tooltip"
                className="absolute top-0 right-0 rounded-sm p-1 text-neutral-800 opacity-60 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
                onClick={() => {}}
              >
                <CircularProgress
                  milliseconds={intervalRemaining}
                  maxMilliseconds={maxInterval}
                  setMilliseconds={(value: number) => {
                    setIntervalRemaining(value);
                  }}
                ></CircularProgress>
              </button>
            </>
          ) : (
            <button
              className="absolute right-2 top-2 rounded-sm p-1 text-neutral-800 opacity-60 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
              onClick={handleSend}
            >
              {messageIsStreaming ? (
                <div className="h-4 w-4 animate-spin rounded-full border-t-2 text-zinc-500 dark:text-zinc-400"></div>
              ) : (
                <IconSend size={18} />
              )}
            </button>
          )}

          {showPromptList && filteredPrompts.length > 0 && (
            <div className="absolute bottom-12 w-full z-20">
              <PromptList
                activePromptIndex={activePromptIndex}
                prompts={filteredPrompts}
                onSelect={handleInitModal}
                onMouseOver={setActivePromptIndex}
                promptListRef={promptListRef}
              />
            </div>
          )}

          {isModalVisible && (
            <VariableModal
              prompt={prompts[activePromptIndex]}
              variables={variables}
              onSubmit={handleSubmit}
              onClose={() => setIsModalVisible(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
