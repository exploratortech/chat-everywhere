/* eslint-disable @next/next/no-img-element */
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import HomeContext from '@/components/home/home.context';

import { LineShareButton } from '../LineShareButton';
import StudentShareMessageButton from '../StudentShareMessageButton';

import dayjs from 'dayjs';

interface AiPainterProps {
  src: string;
  alt: string;
}

// This component is used to display the AI painter result (Backward compatibility, no longer used)
const AiPainter: React.FC<AiPainterProps> = ({ src, alt }) => {
  const { t: mjImageT } = useTranslation('mjImage');
  const {
    state: { isTempUser },
  } = useContext(HomeContext);
  const isStudentAccount = isTempUser;
  const filename =
    'chateverywhere-' +
    alt.split(' ').slice(0, 10).join('_') +
    `-${dayjs().valueOf()}` +
    '.png';
  return (
    <div className="flex flex-col gap-4 ">
      <div className="relative">
        <img
          src={src}
          alt={alt}
          className={`m-0 w-full transition-all duration-500 `}
        />

        <div className="absolute bottom-0 right-0 z-10 flex gap-2 p-1">
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
      <button
        className="max-w-max cursor-pointer select-none border border-white px-4 py-2 font-bold text-white transition-all duration-500 hover:bg-white hover:text-black"
        onClick={() => {
          downloadFile(src, filename);
        }}
      >
        {mjImageT('Download Image')}
      </button>
    </div>
  );
};

export default AiPainter;
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
