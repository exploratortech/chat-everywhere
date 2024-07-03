import { IconMessagePlus } from '@tabler/icons-react';
import { useContext } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { UserFile } from '@/types/UserFile';
import { PluginID } from '@/types/plugin';

import HomeContext from '../home/home.context';
import { Button } from '../ui/button';

function AddToChatButton({
  file,
  closeDialogCallback,
}: {
  file: UserFile;
  closeDialogCallback: () => void;
}) {
  const {
    state: { currentMessage },
    dispatch: homeDispatch,
  } = useContext(HomeContext);
  const handleAddToChat = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const existingFiles = currentMessage?.fileList || [];
    const isFileAlreadyIncluded = existingFiles.some(
      (existingFile) => existingFile.id === file.id,
    );

    if (!isFileAlreadyIncluded) {
      homeDispatch({
        field: 'currentMessage',
        value: {
          ...currentMessage,
          fileList: [...existingFiles, file],
          pluginId: PluginID.GEMINI,
        },
      });
      toast.success('File added to current chat');
      closeDialogCallback();
    } else {
      toast.error('File already in current chat');
    }
  };
  const { t } = useTranslation('model');
  return (
    <Button size="icon" variant="ghost" onClick={handleAddToChat}>
      <IconMessagePlus />
      <span className="sr-only">{t('Add to current chat')}</span>
    </Button>
  );
}

export default AddToChatButton;
