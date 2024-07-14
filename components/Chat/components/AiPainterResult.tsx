/* eslint-disable @next/next/no-img-element */
import {
  SupabaseClient,
  useSupabaseClient,
} from '@supabase/auth-helpers-react';
import React, { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Spinner from '@/components/Spinner';
import HomeContext from '@/components/home/home.context';

import { LineShareButton } from '../LineShareButton';
import StudentShareMessageButton from '../StudentShareMessageButton';

import dayjs from 'dayjs';

interface Result {
  url: string;
  prompt: string;
  filename: string;
}

interface AiPainterResultProps {
  results: Result[];
}

const AiPainterResult: React.FC<AiPainterResultProps> = ({ results }) => {
  const { t: mjImageT } = useTranslation('mjImage');
  const {
    state: { isTempUser },
  } = useContext(HomeContext);
  const isStudentAccount = isTempUser;

  const imageUrls = useMemo(
    () => results.map((result) => result.url),
    [results],
  );
  const supabase = useSupabaseClient();

  const [isDownloading, setIsDownloading] = useState(false);
  return (
    <div
      id="ai-painter-result"
      className="grid grid-cols-2 gap-4 bg-white rounded-md p-4 mobile:p-2 my-4"
    >
      {results.map((result, index) => (
        <div className="relative group/ai-painter-result" key={result.url}>
          <img
            src={result.url}
            alt={result.prompt}
            loading="lazy"
            className={`w-full m-0 transition-all duration-500`}
            width={300}
            height={300}
          />

          <div className="group-hover/ai-painter-result:flex hidden absolute bottom-0 right-0 p-1 z-10 gap-2">
            <button>
              <LineShareButton
                imageFileUrl={imageUrls[index]}
                size={20}
                displayInProgressToast={true}
              />
            </button>
            {isStudentAccount && (
              <button>
                <StudentShareMessageButton
                  imageFileUrl={result.url}
                  size={20}
                />
              </button>
            )}
          </div>
          <div className="absolute w-full h-full bg-black opacity-60 hidden group-hover/ai-painter-result:flex items-center justify-center top-0 ">
            <button
              className="max-w-max cursor-pointer select-none border border-white text-white font-bold py-2 px-4 hover:bg-white hover:text-black transition-all duration-500"
              disabled={isDownloading}
              onClick={() => {
                setIsDownloading(true);
                downloadFile(
                  supabase,
                  result.filename,
                  generateFilename(result.prompt),
                ).finally(() => {
                  setIsDownloading(false);
                });
              }}
            >
              <div className="flex items-center justify-center">
                {isDownloading && <Spinner className="ml-2" />}
                <span>{mjImageT('Download Image')}</span>
              </div>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(AiPainterResult);

const downloadFile = async (
  supabaseClient: SupabaseClient,
  originalFilename: string,
  filename: string,
) => {
  const data = await supabaseClient.storage
    .from('ai-images')
    .getPublicUrl(originalFilename);

  if (!data) {
    return;
  }

  const response = await fetch(data.data.publicUrl);
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
const generateFilename = (prompt: string) =>
  `chateverywhere-${prompt
    .split(' ')
    .slice(0, 10)
    .join('_')}-${dayjs().valueOf()}.png`;
