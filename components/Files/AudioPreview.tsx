import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useDownloadObjectUrl } from '@/hooks/file/useDownloadObjectUrl';

const AudioPreview = ({ objectPath }: { objectPath: string }) => {
  const { t } = useTranslation('model');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: downloadFile } = useDownloadObjectUrl();
  const downloadInitiated = useRef(false);

  useEffect(() => {
    if (!downloadInitiated.current) {
      downloadInitiated.current = true;
      downloadFile(objectPath)
        .then((res) => {
          if (res.url) {
            setAudioUrl(res.url);
          } else {
            setError('Failed to download audio');
          }
        })
        .catch((err) => {
          setError(`Error downloading Audio: ${err.message}`);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="flex h-full w-[50dvw] max-w-[800px] items-center justify-center mobile:w-full largeDesktop:w-[750px]">
      {audioUrl && (
        <audio
          controls
          className="max-h-full w-full"
          onError={() => setError('Failed to load audio')}
        >
          <source src={audioUrl} type="audio/mpeg" />
          {t('Your browser does not support the audio player')}
        </audio>
      )}
    </div>
  );
};

export default AudioPreview;
