import { IconHelp } from '@tabler/icons-react';
import React, { memo, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

import useRunButtonCommand from '@/hooks/mjQueue/useRunButtonCommand';
import useMediaQuery from '@/hooks/useMediaQuery';

import HomeContext from '@/components/home/home.context';

import { LineShareButton } from '../LineShareButton';
import StudentShareMessageButton from '../StudentShareMessageButton';

import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

interface MjImageComponentProps {
  src: string;
  buttons: string[];
  buttonMessageId: string;
  prompt: string;
  messageIndex: number;
}

export default memo(function MjImageComponentV2({
  src,
  buttons,
  buttonMessageId,
  prompt,
  messageIndex,
}: MjImageComponentProps) {
  const {
    state: { isTempUser, messageIsStreaming },
    dispatch: homeDispatch,
  } = useContext(HomeContext);
  const isStudentAccount = isTempUser;
  const isImageGrid =
    ['U1', 'U2', 'U3', 'U4'].every((u) => buttons.includes(u)) ||
    ['V1', 'V2', 'V3', 'V4'].every((v) => buttons.includes(v));
  const { t: mjImageT } = useTranslation('mjImage');
  const buttonCommandBlackList = ['Vary (Region)'];
  const validButtons = buttons.filter(
    (button) => !buttonCommandBlackList.includes(button),
  );

  const runButtonCommand = useRunButtonCommand();

  const [loading, setLoading] = useState(false);
  const imageButtonOnClick = async (button: string) => {
    setLoading(true);
    await runButtonCommand(button, buttonMessageId, messageIndex);
    setLoading(false);
  };
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

  const isMobileLayout = useMediaQuery('(max-width: 640px)');

  return (
    <div className="flex flex-col gap-4">
      <div className={`group/image relative min-h-[592px]`} tabIndex={1}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className={`m-0 w-full transition-all duration-500 `}
        />
        <button
          className={`absolute right-0 top-0 z-10 cursor-pointer p-1`}
          onClick={helpButtonOnClick}
        >
          <IconHelp size={isMobileLayout ? 16 : undefined} />
        </button>

        <div className={`absolute bottom-0 right-0 z-10 flex gap-2 p-1`}>
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

        {isImageGrid && (
          <div className="absolute right-0 top-0 grid size-full grid-cols-2 grid-rows-2">
            <NumberDisplay number={1} />
            <NumberDisplay number={2} />
            <NumberDisplay number={3} />
            <NumberDisplay number={4} />
          </div>
        )}
      </div>
      <div className={`size-full transition-all duration-500`}>
        {messageIsStreaming ? (
          // Button selections
          <div className={`h-full flex-col items-center justify-center gap-2`}>
            {mjImageT('Image processing... ')}
          </div>
        ) : (
          // Button selections
          <div className="flex flex-col gap-2">
            <button
              data-cy="mj-image-v2-download-button"
              className="max-w-max cursor-pointer select-none border border-white px-4 py-2 font-bold text-white transition-all duration-500 hover:bg-white hover:text-black"
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
              data-cy="mj-image-v2-button-container"
              className={`flex h-full flex-wrap items-center gap-2 mobile:text-sm`}
            >
              {validButtons.map((command, index) => {
                return (
                  <button
                    key={`${command}-${index}`}
                    className={cn(
                      'cursor-pointer select-none border border-white text-white font-bold py-2 px-4 hover:bg-white hover:text-black transition-all duration-500 flex-shrink-0 min-w-max',
                      {
                        'opacity-50': loading || messageIsStreaming,
                      },
                    )}
                    onClick={() => imageButtonOnClick(command)}
                    disabled={loading || messageIsStreaming}
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
}, areEqual);
function NumberDisplay({ number }: { number: number }) {
  return (
    <div className="flex size-full items-center justify-center">
      <span
        className="px-2 py-1 text-8xl font-semibold text-white opacity-[.3]"
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

function areEqual(
  prevProps: MjImageComponentProps,
  nextProps: MjImageComponentProps,
) {
  return prevProps.buttonMessageId === nextProps.buttonMessageId;
}
