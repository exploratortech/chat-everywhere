import { IconDownload, IconMessagePlus, IconTrash } from '@tabler/icons-react';
import { useContext, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useDeleteObject } from '@/hooks/file/useDeleteObject';
import { useDownloadObjectUrl } from '@/hooks/file/useDownloadObjectUrl';
import { useFetchFileList } from '@/hooks/file/useFetchFileList';
import useHomeLoadingBar from '@/hooks/useHomeLoadingBar';

import { UserFile } from '@/types/UserFile';
import { PluginID } from '@/types/plugin';

import { Button } from '@/components/ui/button';

import UserFileItemIcon from '../Chat/UserFileItemIcon';
import HomeContext from '../home/home.context';

import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-tw';

export function FileListGridView({
  closeDialogCallback,
}: {
  closeDialogCallback: () => void;
}) {
  const { data: userFiles, isFetching } = useFetchFileList();
  const { t } = useTranslation('model');

  const { startLoadingBar, completeLoadingBar } = useHomeLoadingBar();

  useEffect(() => {
    if (isFetching) {
      startLoadingBar();
    } else {
      completeLoadingBar();
    }
  }, [isFetching, startLoadingBar, completeLoadingBar]);

  return (
    <div className="flex flex-col">
      <div className="flex-1 overflow-auto p-6">
        {userFiles && userFiles.length === 0 ? (
          <div className="text-center">{t('No files uploaded')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {userFiles &&
              userFiles.map((file, index) => (
                <div
                  key={`${file.id}-${index}`}
                  className="border rounded-lg shadow-sm overflow-hidden"
                  title={file.filename}
                >
                  <div className="group h-full hover:bg-neutral-800 p-4 flex flex-col items-center justify-start">
                    <div className="flex items-center content-start justify-center w-12 h-12 bg-neutral-800 rounded-full my-4">
                      <UserFileItemIcon fileType={file.filetype} />
                    </div>
                    <div className="font-medium text-center mb-2 h-[3rem] overflow-hidden">
                      {file.filename}
                    </div>
                    <div className="text-neutral-400 text-sm text-center">
                      <RelativeTimeComponent time={file.timeCreated} /> -{' '}
                      {formatFileSize(file.size)}
                    </div>
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity mt-4">
                      <DownloadButton
                        objectPath={file.objectPath}
                        fileName={file.filename}
                      />
                      <AddToChatButton
                        file={file}
                        closeDialogCallback={closeDialogCallback}
                      />

                      <TrashButton objectPath={file.objectPath} />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

const RelativeTimeComponent = ({ time }: { time: string }) => {
  const { i18n } = useTranslation();

  switch (i18n.language) {
    case 'zh-Hant':
    case 'zh':
      return <span>{dayjs(time).locale('zh-tw').fromNow()}</span>;
    case 'zh-Hans':
    case 'cn':
      return <span>{dayjs(time).locale('zh-cn').fromNow()}</span>;
    default:
      return <span>{dayjs(time).locale('en').fromNow()}</span>;
  }
};

function DownloadButton({
  objectPath,
  fileName,
}: {
  objectPath: string;
  fileName: string;
}) {
  const { t } = useTranslation('model');
  const { mutateAsync: downloadFile } = useDownloadObjectUrl();

  const handleDownload = async () => {
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
  const handleAddToChat = () => {
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

function TrashButton({ objectPath }: { objectPath: string }) {
  const { mutateAsync: deleteFile } = useDeleteObject();
  const { t } = useTranslation('model');
  return (
    <Button size="icon" variant="ghost" onClick={() => deleteFile(objectPath)}>
      <IconTrash />
      <span className="sr-only">{t('Delete')}</span>
    </Button>
  );
}

const formatFileSize = (sizeInBytes: string) => {
  const bytes = parseInt(sizeInBytes);
  if (isNaN(bytes)) {
    return 'Invalid size';
  }

  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  if (bytes < KB) {
    return `${bytes} bytes`;
  } else if (bytes < MB) {
    return `${(bytes / KB).toFixed(2)} KB`;
  } else if (bytes < GB) {
    return `${(bytes / MB).toFixed(2)} MB`;
  } else {
    return `${(bytes / GB).toFixed(2)} GB`;
  }
};
