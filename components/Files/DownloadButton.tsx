import { IconDownload } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { useDownloadObjectUrl } from '@/hooks/file/useDownloadObjectUrl';

import { Button } from '../ui/button';

function DownloadButton({
  objectPath,
  fileName,
}: {
  objectPath: string;
  fileName: string;
}) {
  const { t } = useTranslation('model');
  const { mutateAsync: downloadFile } = useDownloadObjectUrl();

  const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      const result = await downloadFile(objectPath);
      const url = result.url;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const blob = await response.blob();
      const downloadLink = document.createElement('a');
      const blobUrl = window.URL.createObjectURL(blob);

      downloadLink.href = blobUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // Clean up
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <Button size="icon" variant="ghost" onClick={handleDownload}>
      <IconDownload />
      <span className="sr-only">{t('Download')}</span>
    </Button>
  );
}

export default DownloadButton;
