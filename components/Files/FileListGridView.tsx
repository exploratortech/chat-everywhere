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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {userFiles &&
              userFiles.map((file, index) => (
                <div
                  key={`${file.id}-${index}`}
                  className="overflow-hidden rounded-lg border shadow-sm"
                  title={file.filename}
                >
                  <FilePreviewModal file={file}>
                    <div className="group flex h-full flex-col items-center justify-start p-4 hover:bg-neutral-800">
                      <div className="my-4 flex size-12 content-start items-center justify-center rounded-full bg-neutral-800">
                        <UserFileItemIcon fileType={file.filetype} />
                      </div>
                      <div className="mb-2 h-12 overflow-hidden text-center font-medium">
                        {file.filename}
                      </div>
                      <div className="text-center text-sm text-neutral-400">
                        <RelativeTimeComponent time={file.timeCreated} /> -{' '}
                        {formatFileSize(file.size)}
                      </div>
                      <div className="mt-4 flex items-center justify-end space-x-2 opacity-0 transition-opacity group-hover:opacity-100">
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
