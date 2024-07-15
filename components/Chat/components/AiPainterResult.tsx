/* eslint-disable @next/next/no-img-element */
import type { SupabaseClient } from '@supabase/auth-helpers-react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
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
      className="my-4 grid grid-cols-2 gap-4 rounded-md bg-white p-4 mobile:p-2"
    >
      {results.map((result, index) => (
        <div className="group/ai-painter-result relative" key={result.url}>
          <img
            src={result.url}
            alt={result.prompt}
            loading="lazy"
            className={`m-0 w-full transition-all duration-500`}
            width={300}
            height={300}
          />

          <div className="absolute bottom-0 right-0 z-10 hidden gap-2 p-1 group-hover/ai-painter-result:flex">
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
          <div className="absolute top-0 hidden size-full items-center justify-center bg-black opacity-60 group-hover/ai-painter-result:flex ">
            <button
              className="max-w-max cursor-pointer select-none border border-white px-4 py-2 font-bold text-white transition-all duration-500 hover:bg-white hover:text-black"
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
