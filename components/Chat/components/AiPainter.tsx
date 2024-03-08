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

const AiPainter: React.FC<AiPainterProps> = ({ src, alt }) => {
  const { t: mjImageT } = useTranslation('mjImage');
  const {
    state: { isTempUser },
  } = useContext(HomeContext);
  const isStudentAccount = isTempUser;
  return (
    <div className="flex flex-col gap-4 ">
      <div className="relative">
        <img
          src={src}
          alt={alt}
          className={`w-full m-0 transition-all duration-500 `}
        />

        {!isStudentAccount && (
          <button className={`absolute bottom-0 right-0 p-1 z-10`}>
            <LineShareButton
              imageFileUrl={src}
              size={20}
              displayInProgressToast={true}
            />
          </button>
        )}
        {isStudentAccount && (
          <button className={`absolute bottom-0 right-0 p-1 z-10`}>
            <StudentShareMessageButton imageFileUrl={src} size={20} />
          </button>
        )}
      </div>
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
