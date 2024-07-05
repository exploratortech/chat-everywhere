import { useEffect, useRef, useState } from 'react';

import { useDownloadObjectUrl } from '@/hooks/file/useDownloadObjectUrl';
import { useTranslation } from 'react-i18next';

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
    <div className="w-[50dvw] largeDesktop:w-[750px] mobile:w-full h-full max-w-[800px] flex items-center justify-center">
      {audioUrl && (
        <audio
          controls
          className="w-full max-h-full"
          onError={() => setError('Failed to load audio')}
        >
          <source src={audioUrl} type="audio/mpeg" />
          {
            t('Your browser does not support the audio player')
          }
        </audio>
      )}
    </div>
  );
};

export default AudioPreview;
