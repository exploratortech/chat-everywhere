/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';

import { useDownloadObjectUrl } from '@/hooks/file/useDownloadObjectUrl';

const ImagePreview = ({ objectPath }: { objectPath: string }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: downloadFile } = useDownloadObjectUrl();
  const downloadInitiated = useRef(false);

  useEffect(() => {
    if (!downloadInitiated.current) {
      downloadInitiated.current = true;
      downloadFile(objectPath)
        .then((res) => {
          if (res.url) {
            setImageUrl(res.url);
          } else {
            setError('Failed to download image');
          }
        })
        .catch((err) => {
          setError(`Error downloading Image: ${err.message}`);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="mobile:max-w-[90dvw] max-w-[800px] max-h-[90dvh] w-full h-full flex items-center justify-center">
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Preview"
          className="max-w-full max-h-full object-contain"
          onError={() => setError('Failed to load image')}
        />
      )}
    </div>
  );
};

export default ImagePreview;
