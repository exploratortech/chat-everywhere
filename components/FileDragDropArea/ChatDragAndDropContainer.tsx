import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { useMultipleFileUploadHandler } from '@/hooks/file/useMultipleFileUploadHandler';

import { createFileList, handleFileUpload } from '@/utils/app/uploadFileHelper';

import HomeContext from '../home/home.context';
import DragAndDrop from './DragAndDrop';

const ChatDragAndDropContainer = () => {
  const { t } = useTranslation('model');
  const {
    state: { showFilePortalModel },
  } = useContext(HomeContext);
  const { uploadFiles, isLoading: isUploading } =
    useMultipleFileUploadHandler();

  return (
    <>
      {!showFilePortalModel && (
        <DragAndDrop
          onFilesDrop={(files) => {
            handleFileUpload(createFileList(files), uploadFiles, () => {}, t);
          }}
        />
      )}
      {isUploading && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <p className="text-2xl font-semibold text-white">{t('Loading...')}</p>
        </div>
      )}
    </>
  );
};

export default ChatDragAndDropContainer;
