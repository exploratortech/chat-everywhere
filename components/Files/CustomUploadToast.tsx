import { useTranslation } from 'react-i18next';

import { UploadProgress } from '../User/File/UploadProgress';

const CustomUploadToast = ({
  fileName,
  progress,
  isSuccessUpload,
}: {
  fileName: string;
  progress: number;
  isSuccessUpload: boolean | null;
}) => {
  const { t } = useTranslation('model');
  return (
    <div className="flex flex-col  items-center space-x-2">
      <div>{`${t('Uploading')}: ${fileName}`}</div>
      <div className="w-full">
        <UploadProgress
          progressNumber={progress}
          isSuccessUpload={isSuccessUpload}
        />
      </div>
    </div>
  );
};
export default CustomUploadToast;
