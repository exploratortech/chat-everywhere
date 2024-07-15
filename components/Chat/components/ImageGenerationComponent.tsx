import { IconCloudDownload } from '@tabler/icons-react';
import type { FC } from 'react';
import React, { useState } from 'react';

import Image from 'next/image';

import dayjs from 'dayjs';

type Props = {
  src: string;
  generationPrompt: string;
};

export const ImageGenerationComponent: FC<Props> = ({
  src,
  generationPrompt,
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);

  return (
    <div className="flex h-52 flex-row items-center justify-center xxs:h-60 xs:h-72 sm:h-[22rem] md:h-[34rem] lg:h-[40rem]">
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
      </div>

      {isImageLoaded && (
        <div className="ml-2 flex flex-col text-gray-500 dark:text-gray-400">
          <button
            className="mt-1 h-fit cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
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
