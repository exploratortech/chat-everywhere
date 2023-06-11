import {
  IconApps,
  IconAspectRatio,
  IconCloudDownload,
  IconTools,
  IconToolsOff,
} from '@tabler/icons-react';
import { FC, useContext, useEffect, useMemo, useState } from 'react';

import { useTranslation } from 'next-i18next';
import Image from 'next/image';

import dayjs from 'dayjs';

type Props = {
  src: string;
  title?: string; // where message ID is being passed down
};

export const ImageGenerationComponent: FC<Props> = ({
  src,
  title: buttonMessageId,
}) => {
  const { t } = useTranslation('chat');
  const [isOperationalMode, setIsOperationalMode] = useState<boolean>(false);
  const [enableAdditionalTools, setEnableAdditionalTools] =
    useState<boolean>(false);

  useEffect(() => {
    if (buttonMessageId && buttonMessageId.length > 0) {
      setEnableAdditionalTools(true);
    }
  }, [buttonMessageId]);

  const upscaleImageButtonOnClick = (imagePosition: number) => {
    console.log('upscaleImageButtonOnClick', imagePosition, buttonMessageId);
  };

  const variousImageButtonOnClick = (imagePosition: number) => {
    console.log('variousImageButtonOnClick', imagePosition, buttonMessageId);
  };

  const OperationalButtons = ({ imagePosition }: { imagePosition: number }) =>
    useMemo(
      () => (
        <div className="flex flex-col text-sm">
          <button
            className="hover:text-gray-700 dark:hover:text-gray-300 h-fit mb-2"
            onClick={() => upscaleImageButtonOnClick(imagePosition)}
            title={t('Upscale') || 'Upscale'}
          >
            <IconAspectRatio size={20} fill="none" />
          </button>
          <button
            className="hover:text-gray-700 dark:hover:text-gray-300 h-fit"
            onClick={() => variousImageButtonOnClick(imagePosition)}
            title={t('Various') || 'Various'}
          >
            <IconApps size={20} fill="none" />
          </button>
        </div>
      ),
      [imagePosition],
    );

  return (
    <div className="flex flex-row h-[15rem] md:h-[38rem] justify-center">
      {isOperationalMode && (
        <div className="flex flex-col justify-between h-full mr-1">
          <OperationalButtons imagePosition={1} />
          <OperationalButtons imagePosition={3} />
        </div>
      )}
      <Image
        src={src}
        alt={''}
        width={0}
        height={0}
        sizes="100vw"
        style={{ width: '100%', height: 'auto', marginTop: 0, marginBottom: 0 }}
      />
      {isOperationalMode && (
        <div className="flex flex-col justify-between h-full ml-1">
          <OperationalButtons imagePosition={2} />
          <OperationalButtons imagePosition={4} />
        </div>
      )}
      <div className="flex flex-col ml-2 text-gray-500 dark:text-gray-400">
        {enableAdditionalTools && (
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
              `chateverywhere-ai-image-${dayjs().valueOf()}.png`,
            )
          }
        >
          <IconCloudDownload size={16} fill="none" />
        </button>
      </div>
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
