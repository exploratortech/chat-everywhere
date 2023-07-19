import {
  IconAspectRatio,
  IconCloudDownload,
  IconTools,
  IconToolsOff,
} from '@tabler/icons-react';
import { FC, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { useTranslation } from 'next-i18next';
import Image from 'next/image';

import { saveConversation, saveConversations } from '@/utils/app/conversation';

import { Conversation, Message } from '@/types/chat';

import HomeContext from '@/pages/api/home/home.context';

import dayjs from 'dayjs';

import { trackError } from '@/utils/app/azureTelemetry';

type Props = {
  src: string;
  messageIndex: number;
  generationPrompt: string;
  title?: string; // where message ID is being passed down
};

const upscaleImage = async (
  userToken: string,
  buttonMessageId: string,
  imagePosition: number,
  operation: 'upscale' | 'various',
): Promise<string> => {
  const operationalResponse = await fetch('api/image-upscale', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'user-token': userToken,
    },
    body: JSON.stringify({
      buttonMessageId,
      imagePosition,
      operation,
    }),
  });

  if (!operationalResponse.ok) {
    throw new Error(operationalResponse.statusText);
  }

  const { imageUrl } = await operationalResponse.json();

  if (!imageUrl) {
    throw new Error('No data');
  }

  return imageUrl;
};

export const ImageGenerationComponent: FC<Props> = ({
  src,
  title: buttonMessageId,
  messageIndex,
  generationPrompt,
}) => {
  const { t } = useTranslation('chat');
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);
  const [isOperationalMode, setIsOperationalMode] = useState<boolean>(false);
  const [enableAdditionalTools, setEnableAdditionalTools] =
    useState<boolean>(false);
  const [imageOperationInProgress, setImageOperationInProgress] =
    useState(false);

  const {
    state: { user, isPaidUser, selectedConversation, conversations },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  useEffect(() => {
    if (buttonMessageId && buttonMessageId.length > 0) {
      setEnableAdditionalTools(true);
    }
  }, [buttonMessageId]);

  const upscaleImageButtonOnClick = async (imagePosition: number) => {
    setImageOperationInProgress(true);

    try {
      const upscaledImageUrl = await upscaleImage(
        user?.token || '',
        buttonMessageId || '',
        imagePosition,
        'upscale',
      );

      if (upscaledImageUrl) {
        const lastMessage =
          selectedConversation &&
          selectedConversation.messages[
            selectedConversation.messages.length - 1
          ];

        if (!lastMessage) {
          return;
        }

        const updatedMessages: Message[] = selectedConversation.messages.map(
          (message, index) => {
            if (index === messageIndex) {
              return {
                ...message,
                content:
                  message.content +
                  `![${generationPrompt}](${upscaledImageUrl}) \n`,
              };
            }
            return message;
          },
        );

        const updatedConversation = {
          ...selectedConversation,
          messages: updatedMessages,
          lastUpdateAtUTC: dayjs().valueOf(),
        };

        homeDispatch({
          field: 'selectedConversation',
          value: updatedConversation,
        });

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
      }
    } catch (e) {
      console.log(e);
      toast.error(t('Upscale image failed') || 'Upscale image failed');
      //Log error to Azure App Insights
      trackError(e as string);
    }

    setImageOperationInProgress(false);
  };

  const OperationalButtons = ({ imagePosition }: { imagePosition: number }) =>
    useMemo(
      () => (
        <div className="flex flex-col text-sm">
          <button
            className="hover:text-gray-700 dark:hover:text-gray-300 h-fit mb-2"
            onClick={() => upscaleImageButtonOnClick(imagePosition)}
            title={t('Upscale') || 'Upscale'}
            disabled={imageOperationInProgress}
          >
            <IconAspectRatio size={20} fill="none" />
          </button>
          {/* Disable for future implementation */}
          {/* <button
            className="hover:text-gray-700 dark:hover:text-gray-300 h-fit"
            onClick={() => variousImageButtonOnClick(imagePosition)}
            title={t('Various') || 'Various'}
          >
            <IconApps size={20} fill="none" />
          </button> */}
        </div>
      ),
      [imagePosition],
    );

  return (
    <div className="flex flex-row h-[13rem] xxs:h-[15rem] xs:h-[18rem] sm:h-[22rem] md:h-[34rem] lg:h-[40rem] justify-center items-center">
      {isOperationalMode && (
        <div className="flex flex-col justify-between h-full mr-1">
          <OperationalButtons imagePosition={1} />
          <OperationalButtons imagePosition={3} />
        </div>
      )}
      <div className="relative h-fit">
        <Image
          src={src}
          alt={generationPrompt}
          width={0}
          height={0}
          sizes="70vw"
          style={{
            width: '100%',
            height: 'auto',
            marginTop: 0,
            marginBottom: 0,
          }}
          onLoad={() => setIsImageLoaded(true)}
        />
        {imageOperationInProgress && (
          <div className="absolute w-full h-full top-0 left-0 bg-gray-800 opacity-50">
            <div
              className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-white rounded-full opacity-100 absolute bottom-3 right-3"
              aria-label="loading"
            />
          </div>
        )}
      </div>
      {isOperationalMode && (
        <div className="flex flex-col justify-between h-full ml-1">
          <OperationalButtons imagePosition={2} />
          <OperationalButtons imagePosition={4} />
        </div>
      )}
      {isImageLoaded && (
        <div className="flex flex-col ml-2 text-gray-500 dark:text-gray-400">
          {enableAdditionalTools && user && isPaidUser && (
            <button
              className={`hover:text-gray-700 dark:hover:text-gray-300 h-fit`}
              onClick={() => setIsOperationalMode(!isOperationalMode)}
            >
              {isOperationalMode ? (
                <IconToolsOff size={15} fill="none" />
              ) : (
                <IconTools size={15} fill="none" />
              )}
            </button>
          )}
          <button
            className="hover:text-gray-700 dark:hover:text-gray-300 h-fit mt-1 cursor-pointer"
            onClick={() =>
              downloadFile(
                src,
                'chateverywhere-' +
                  (generationPrompt ? `${generationPrompt}-` : '') +
                  dayjs().valueOf() +
                  '.png',
              )
            }
          >
            <IconCloudDownload size={16} fill="none" />
          </button>
        </div>
      )}
    </div>
  );
};

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
