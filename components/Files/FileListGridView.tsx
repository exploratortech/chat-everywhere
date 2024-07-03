import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useFetchFileList } from '@/hooks/file/useFetchFileList';
import useHomeLoadingBar from '@/hooks/useHomeLoadingBar';

import UserFileItemIcon from '../Chat/UserFileItemIcon';
import AddToChatButton from './AddToChatButton';
import DownloadButton from './DownloadButton';
import FilePreviewModal from './FilePreviewModal';
import RelativeTimeComponent from './RelativeTimeComponent';
import TrashButton from './TrashButton';

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
                  <FilePreviewModal file={file}>
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
                  </FilePreviewModal>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
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
