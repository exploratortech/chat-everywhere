import { IconRotateClockwise, IconUpload } from '@tabler/icons-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { allowedTypes } from '@/utils/app/uploadFileHelper';

import { Button } from '@/components/ui/button';

const UploadFileButton = ({
  isUploading,
  onFilesDrop,
}: {
  onFilesDrop: (files: FileList) => Promise<void>;
  isUploading: boolean;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const { t } = useTranslation('model');

  return (
    <>
      <Button
        className="min-w-[7.5rem] inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 bg-neutral-50 text-neutral-900 hover:bg-neutral-50/90 focus:ring-neutral-300"
        onClick={triggerFileInput}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <IconRotateClockwise className="mr-2 h-4 w-4 animate-spin" />
            {t('Uploading...')}
          </>
        ) : (
          <>
            <IconUpload className="mr-2 h-4 w-4" />
            {t('Upload')}
          </>
        )}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedTypes.join(',')}
        className="hidden"
        onChange={async (e) => {
          if (e.target.files) {
            await onFilesDrop(e.target.files);
            clearFileInput();
          }
        }}
      />
    </>
  );
};
export default UploadFileButton;
