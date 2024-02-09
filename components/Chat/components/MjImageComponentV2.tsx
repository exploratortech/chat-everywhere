import { IconHelp } from '@tabler/icons-react';
import React, { useCallback, useContext } from 'react';
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
import { getUpdatedAssistantMjConversationV2 } from '@/utils/app/mjImage';
import { removeSecondLastLine } from '@/utils/app/ui';

import { Conversation, Message } from '@/types/chat';

import HomeContext from '@/pages/api/home/home.context';

import { LineShareButton } from '../LineShareButton';
import StudentShareMessageButton from '../StudentShareMessageButton';

import dayjs from 'dayjs';

interface MjImageComponentProps {
  src: string;
  buttons: string[];
  buttonMessageId: string;
  prompt: string;
}

export default function MjImageComponentV2({
  src,
  buttons,
  buttonMessageId,
  prompt,
}: MjImageComponentProps) {
  const {
    state: { user, selectedConversation, conversations, messageIsStreaming },
    dispatch: homeDispatch,
    stopConversationRef,
  } = useContext(HomeContext);
  const isImageGrid =
    ['U1', 'U2', 'U3', 'U4'].every((u) => buttons.includes(u)) ||
    ['V1', 'V2', 'V3', 'V4'].every((v) => buttons.includes(v));
  const { t: commonT } = useTranslation('common');
  const { t: mjImageT } = useTranslation('mjImage');
  const buttonCommandBlackList = ['Vary (Region)'];
  const validButtons = buttons.filter(
    (button) => !buttonCommandBlackList.includes(button),
  );

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

  const imageButtonOnClick = async (button: string) => {
    if (!user) {
      toast.error(commonT('Please sign in to use ai image feature'));
    }
    const updatedConversation = getUpdatedAssistantMjConversationV2(
      selectedConversation!,
      buttonMessageId,
    );
    console.log('updatedConversation', updatedConversation);
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
  const [isFocus, setIsFocus] = React.useState(false);
  // Function to show the buttons
  const handleDivFocus = () => {
    setIsFocus(true);
  };

  // Function to hide the buttons
  const handleDivBlur = () => {
    setTimeout(() => {
      setIsFocus(false);
    }, 300);
  };
  const isMobileLayout = useMediaQuery('(max-width: 640px)');

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`group/image relative`}
        tabIndex={1}
        onFocus={handleDivFocus}
        onBlur={handleDivBlur}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className={`w-full m-0 transition-all duration-500 `}
        />
        <button
          className={`absolute top-0 right-0 p-1 cursor-pointer z-10`}
          onClick={helpButtonOnClick}
        >
          <IconHelp size={isMobileLayout ? 16 : undefined} />
        </button>
        <button className={`absolute bottom-0 right-0 p-1 z-10`}>
          <LineShareButton
            imageFileUrl={src}
            size={20}
            displayInProgressToast={true}
          />
        </button>
        <button className={`absolute bottom-0 right-7 p-1 z-10`}>
          <StudentShareMessageButton imageFileUrl={src} size={20} />
        </button>
        {isImageGrid && (
          <div className="grid grid-cols-2 grid-rows-2 absolute top-0 right-0 w-full h-full">
            <NumberDisplay number={1} />
            <NumberDisplay number={2} />
            <NumberDisplay number={3} />
            <NumberDisplay number={4} />
          </div>
        )}
      </div>
      <div className={`transition-all duration-500 w-full h-full`}>
        {messageIsStreaming ? (
          // Button selections
          <div className={`flex-col gap-2 justify-center items-center h-full`}>
            {mjImageT('Image processing... ')}
          </div>
        ) : (
          // Button selections
          <div className="flex gap-2 flex-col">
            <button
              className="max-w-max cursor-pointer select-none border border-white text-white font-bold py-2 px-4 hover:bg-white hover:text-black transition-all duration-500"
              onClick={() => {
                downloadFile(
                  src,
                  'chateverywhere-' + prompt + dayjs().valueOf() + '.png',
                );
              }}
            >
              {mjImageT('Download Image')}
            </button>
            <div
              className={`flex flex-wrap gap-2 items-center h-full mobile:text-sm`}
            >
              {validButtons.map((command, index) => {
                return (
                  <button
                    key={`${command}-${index}`}
                    className="cursor-pointer select-none border border-white text-white font-bold py-2 px-4 hover:bg-white hover:text-black transition-all duration-500 flex-shrink-0 min-w-max"
                    onClick={() => imageButtonOnClick(command)}
                  >
                    {command}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function NumberDisplay({ number }: { number: number }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span
        className="text-white text-8xl opacity-[.3] font-semibold px-2 py-1"
        style={{
          textShadow: '0px 0px 5px rgba(0, 0, 0, 0.5)',
          outline: '1px solid white',
        }}
      >
        {number}
      </span>
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
