import { useEffect, useRef, useState } from 'react';

import { useDownloadObjectUrl } from '@/hooks/file/useDownloadObjectUrl';
import useWindowWidth from '@/hooks/useWindowWidth';

const PDFPreview = ({ objectPath }: { objectPath: string }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: downloadFile } = useDownloadObjectUrl();
  const downloadInitiated = useRef(false);

  useEffect(() => {
    if (!downloadInitiated.current) {
      downloadInitiated.current = true;
      downloadFile(objectPath)
        .then((res) => {
          if (res.url) {
            setPdfUrl(res.url);
          } else {
            setError('Failed to download pdf');
          }
        })
        .catch((err) => {
          setError(`Error downloading PDF: ${err.message}`);
        });
    }
  }, [objectPath, downloadFile]);

  const windowWidth = useWindowWidth();

  if (error) {
    return <div>Error: {error}</div>;
  }
  return (
    <div className="flex !h-[70dvh] w-[50dvw] max-w-[800px] items-center justify-center mobile:w-full largeDesktop:w-[750px]">
      {pdfUrl && (
        <iframe key={windowWidth} src={pdfUrl} width="100%" height="100%" />
      )}
    </div>
  );
};

export default PDFPreview;
