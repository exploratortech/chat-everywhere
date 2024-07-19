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
        className="inline-flex min-w-[7.5rem] items-center justify-center rounded-md bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-900 shadow transition-colors hover:bg-neutral-50/90 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2"
        onClick={triggerFileInput}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <IconRotateClockwise className="mr-2 size-4 animate-spin" />
            {t('Uploading...')}
          </>
        ) : (
          <>
            <IconUpload className="mr-2 size-4" />
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
