import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useDownloadObjectUrl } from '@/hooks/file/useDownloadObjectUrl';

const VideoPreview = ({ objectPath }: { objectPath: string }) => {
  const { t } = useTranslation('model');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: downloadFile } = useDownloadObjectUrl();
  const downloadInitiated = useRef(false);

  useEffect(() => {
    if (!downloadInitiated.current) {
      downloadInitiated.current = true;
      downloadFile(objectPath)
        .then((res) => {
          if (res.url) {
            setVideoUrl(res.url);
          } else {
            setError('Failed to download video');
          }
        })
        .catch((err) => {
          setError(`Error downloading Video: ${err.message}`);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="flex size-full max-h-[90dvh] max-w-[800px] items-center justify-center mobile:max-w-[90dvw]">
      {videoUrl && (
        <video
          controls
          width="100%"
          height="auto"
          className="max-h-full max-w-full object-contain"
          onError={() => setError('Failed to load video')}
        >
          <source src={videoUrl} type="video/mp4" />
          {t('Your browser does not support the video player')}
        </video>
      )}
    </div>
  );
};

export default VideoPreview;
