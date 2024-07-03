import { useEffect, useRef, useState } from 'react';

import { useDownloadObjectUrl } from '@/hooks/file/useDownloadObjectUrl';

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

  if (error) {
    return <div>Error: {error}</div>;
  }
  return (
    <div className="!w-[90dvw] !h-[90dvh] flex items-center justify-center">
      {pdfUrl && <iframe src={pdfUrl} width="100%" height="100%" />}
    </div>
  );
};

export default PDFPreview;
