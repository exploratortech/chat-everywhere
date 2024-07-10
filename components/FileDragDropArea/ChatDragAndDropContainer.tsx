import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { useMultipleFileUploadHandler } from '@/hooks/file/useMultipleFileUploadHandler';

import {
  createFileList,
  validateAndUploadFiles,
} from '@/utils/app/uploadFileHelper';

import { UserFile } from '@/types/UserFile';
import { PluginID } from '@/types/plugin';

import HomeContext from '../home/home.context';
import DragAndDrop from './DragAndDrop';

const ChatDragAndDropContainer = () => {
  const { t } = useTranslation('model');
  const {
    state: { showFilePortalModel, currentMessage, isUltraUser },
    dispatch: homeDispatch,
  } = useContext(HomeContext);
  const { uploadFiles, isLoading: isUploading } =
    useMultipleFileUploadHandler();

  const handleAddToChat = (userFiles: UserFile[]) => {
    if (!userFiles) {
      console.log('no user file ');
      return;
    }

    const existingFiles = currentMessage?.fileList || [];
    homeDispatch({
      field: 'currentMessage',
      value: {
        ...currentMessage,
        fileList: [...existingFiles, ...userFiles],
        pluginId: PluginID.GEMINI,
      },
    });
  };
  return (
    <>
      {!showFilePortalModel && isUltraUser && (
        <DragAndDrop
          onFilesDrop={(files) => {
            validateAndUploadFiles(
              createFileList(files),
              uploadFiles,
              (latestFiles) => {
                handleAddToChat(latestFiles);
              },
              t,
            );
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
