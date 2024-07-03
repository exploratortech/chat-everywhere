import { useEffect, useState } from 'react';

import { useDownloadObjectUrl } from '@/hooks/file/useDownloadObjectUrl';

const VideoPreview = ({ objectPath }: { objectPath: string }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: downloadFile } = useDownloadObjectUrl();

  useEffect(() => {
    downloadFile(objectPath).then((res) => {
      if (res.url) {
        setVideoUrl(res.url);
      } else {
        setError('Failed to download video');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="max-w-[80dvw] max-h-[80dvh] w-full h-full flex items-center justify-center">
      {videoUrl && (
        <video
          controls
          width="100%"
          height="auto"
          className="max-w-full max-h-full object-contain"
          onError={() => setError('Failed to load video')}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
};

export default VideoPreview;
