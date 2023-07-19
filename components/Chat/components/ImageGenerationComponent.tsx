import { IconCloudDownload } from '@tabler/icons-react';
import React, { FC, useState } from 'react';

import { useTranslation } from 'next-i18next';
import Image from 'next/image';

import dayjs from 'dayjs';

type Props = {
  src: string;
  messageIndex: number;
  generationPrompt: string;
  title?: string; // where message ID is being passed down
};

export const ImageGenerationComponent: FC<Props> = ({
  src,
  title: buttonMessageId,
  messageIndex,
  generationPrompt,
}) => {
  const { t } = useTranslation('chat');
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);
  const [imageOperationInProgress, setImageOperationInProgress] =
    useState(false);

  return (
    <div className="flex flex-row h-[13rem] xxs:h-[15rem] xs:h-[18rem] sm:h-[22rem] md:h-[34rem] lg:h-[40rem] justify-center items-center">
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

      {isImageLoaded && (
        <div className="flex flex-col ml-2 text-gray-500 dark:text-gray-400">
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
