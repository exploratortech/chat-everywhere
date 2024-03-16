import { IconHelp } from '@tabler/icons-react';
import React, { useCallback, useContext, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import useMediaQuery from '@/hooks/useMediaQuery';

import {
  saveConversation,
  saveConversations,
  updateConversation,
  updateConversationLastUpdatedAtTimeStamp,
} from '@/utils/app/conversation';
import {
  removeRedundantTempHtmlString,
  removeTempHtmlString,
} from '@/utils/app/htmlStringHandler';
import { getUpdatedAssistantMjConversation } from '@/utils/app/mjImage';
import { MJ_ALLOWED_COMMAND_LIST } from '@/utils/app/mj_const';
import { removeSecondLastLine } from '@/utils/app/ui';

import { Conversation, Message } from '@/types/chat';

import HomeContext from '@/components/home/home.context';

import { LineShareButton } from '../LineShareButton';
import StudentShareMessageButton from '../StudentShareMessageButton';

import dayjs from 'dayjs';

interface MjImageComponentProps {
  src: string;
  buttons: string[];
  buttonMessageId: string;
  prompt: string;
}

export default function MjImageComponent({
  src,
  buttons,
  buttonMessageId,
  prompt,
}: MjImageComponentProps) {
  const {
    state: {
      user,
      isTempUser,
      selectedConversation,
      conversations,
      messageIsStreaming,
    },
    dispatch: homeDispatch,
    stopConversationRef,
  } = useContext(HomeContext);
  const isStudentAccount = isTempUser;
  const { t: commonT } = useTranslation('common');
  const { t: mjImageT } = useTranslation('mjImage');

  const runButtonCommand = useCallback(
    async (button: string) => {
      if (!user) return;
      let updatedConversation: Conversation;
      if (!selectedConversation) return;
      updatedConversation = selectedConversation;

      homeDispatch({ field: 'loading', value: true });
      homeDispatch({ field: 'messageIsStreaming', value: true });

      const controller = new AbortController();
      const response = await fetch('api/mj-image-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-token': user?.token || '',
        },
        signal: controller.signal,
        body: JSON.stringify({
          button: button,
          buttonMessageId,
          prompt,
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
        updatedConversation.messages[updatedConversation.messages.length - 1]
          .content;
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
      saveConversation(updatedConversation);

      homeDispatch({ field: 'conversations', value: updatedConversations });
      saveConversations(updatedConversations);

      homeDispatch({ field: 'messageIsStreaming', value: false });
      updateConversationLastUpdatedAtTimeStamp();
    },
    [
      buttonMessageId,
      conversations,
      homeDispatch,
      selectedConversation,
      user,
      stopConversationRef,
    ],
  );

  const availableCommands = useMemo(() => {
    return MJ_ALLOWED_COMMAND_LIST.filter((command) =>
      buttons.includes(command),
    );
  }, [buttons]);

  const imageButtonOnClick = async (button: string) => {
    if (!user) {
      toast.error(commonT('Please sign in to use ai image feature'));
    }
    const updatedConversation = getUpdatedAssistantMjConversation(
      selectedConversation!,
      buttonMessageId,
    );
    if (!updatedConversation) return;
    handleUpdateConversation(updatedConversation);
    await runButtonCommand(button);
  };
  const handleUpdateConversation = useCallback(
    (updatedConversation: Conversation) => {
      const { single, all } = updateConversation(
        updatedConversation,
        conversations,
      );
      homeDispatch({ field: 'selectedConversation', value: single });
      homeDispatch({ field: 'conversations', value: all });
    },
    [conversations, homeDispatch],
  );
  const { i18n } = useTranslation();

  const helpButtonOnClick = () => {
    const displayChineseVersion = /^zh/.test(i18n.language);

    const aiImageFeaturePageId = displayChineseVersion
      ? '9f0f23a1-97d6-4323-92d5-9915bdef299b'
      : '0fbc9e16-86e2-4908-af06-d8b278d250db';
    homeDispatch({
      field: 'showFeaturePageOnLoad',
      value: aiImageFeaturePageId,
    });
    homeDispatch({
      field: 'showFeaturesModel',
      value: true,
    });
  };
  const [showButtons, setShowButtons] = React.useState(false);
  // Function to show the buttons
  const handleDivFocus = () => {
    setShowButtons(true);
  };

  // Function to hide the buttons
  const handleDivBlur = () => {
    setTimeout(() => {
      setShowButtons(false);
    }, 300);
  };
  const isMobileLayout = useMediaQuery('(max-width: 640px)');

  return (
    <div
      className={`group/image relative focus:z-10 cursor-pointer`}
      tabIndex={1}
      onFocus={handleDivFocus}
      onBlur={handleDivBlur}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className={`${
          showButtons ? `scale-110` : ''
        } w-full m-0 transition-all duration-500 `}
      />

      <div
        className={`${
          showButtons ? `scale-110 drop-shadow-2xl bg-black/75` : ''
        } transition-all duration-500 absolute top-0 left-0 w-full h-full`}
      >
        {messageIsStreaming ? (
          // Button selections
          <div
            className={`${
              showButtons ? 'flex' : 'hidden'
            } flex-col gap-2 justify-center items-center h-full`}
          >
            {mjImageT('Image processing... ')}
          </div>
        ) : (
          // Button selections
          <div
            className={`${
              showButtons ? 'flex' : 'hidden'
            } mobile:scale-[.75] flex-col gap-2 justify-center items-center h-full mobile:text-sm`}
          >
            <button
              className="cursor-pointer select-none border border-white text-white font-bold py-2 px-4 hover:bg-white hover:text-black transition-all duration-500"
              onClick={() => {
                downloadFile(
                  src,
                  'chateverywhere-' + prompt + dayjs().valueOf() + '.png',
                );
              }}
            >
              {mjImageT('Download Image')}
            </button>
            {availableCommands.map((command, index) => {
              return (
                <button
                  key={`${command}-${index}`}
                  className="cursor-pointer select-none border border-white text-white font-bold py-2 px-4 hover:bg-white hover:text-black transition-all duration-500"
                  onClick={() => imageButtonOnClick(command)}
                >
                  {mjImageT(command)}
                </button>
              );
            })}
          </div>
        )}

        <button
          className={`${
            showButtons ? 'block' : 'hidden'
          } absolute top-0 right-0 p-1 cursor-pointer`}
          onClick={helpButtonOnClick}
        >
          <IconHelp size={isMobileLayout ? 16 : undefined} />
        </button>

        <div
          className={`${
            showButtons ? 'block' : 'hidden'
          }  absolute bottom-0 right-0 p-1 flex gap-2`}
        >
          <button>
            <LineShareButton
              imageFileUrl={src}
              size={20}
              displayInProgressToast={true}
            />
          </button>

          {isStudentAccount && (
            <button>
              <StudentShareMessageButton imageFileUrl={src} size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const downloadFile = async (url: string, filename: string) => {
  const response = await fetch(url);
  const blob = await response.blob();

  const href = URL.createObjectURL(blob);

  // Create a "hidden" anchor tag with the download attribute and simulate a click.
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
