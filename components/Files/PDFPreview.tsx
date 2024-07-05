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
    <div className="w-[50dvw] largeDesktop:w-[750px] mobile:w-full !h-[70dvh] max-w-[800px] flex items-center justify-center">
      {pdfUrl && <iframe
        key={windowWidth}
        src={pdfUrl} width="100%" height="100%" />}
    </div>
  );
};

export default PDFPreview;
