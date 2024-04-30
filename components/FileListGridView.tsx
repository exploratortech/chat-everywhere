import {
  IconDownload,
  IconFile,
  IconMessagePlus,
  IconTrash,
} from '@tabler/icons-react';

import { useFetchFileList } from '@/hooks/useFetchFileList';

import { Button } from '@/components/ui/button';

import UserFileItemIcon from './Chat/UserFileItemIcon';

import dayjs from 'dayjs';

export function FileListGridView() {
  const { data: userFiles } = useFetchFileList();
  return (
    <div className="flex flex-col">
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {userFiles &&
            userFiles.map((file, index) => (
              <div
                key={`${file.id}-${index}`}
                className="border rounded-lg shadow-sm overflow-hidden"
                title={file.filename}
              >
                <div className="group h-full hover:bg-neutral-800 p-4 flex flex-col items-center justify-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-neutral-800 rounded-full mb-4">
                    <UserFileItemIcon fileType={file.filetype} />
                  </div>
                  <div className="font-medium text-center mb-2 h-[3rem]">
                    {file.filename}
                  </div>
                  <div className="text-neutral-400 text-sm text-center">
                    {dayjs(file.timeCreated).format('YYYY-MM-DD')} -{' '}
                    {formatFileSize(file.size)}
                  </div>
                  <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity mt-4">
                    <Button size="icon" variant="ghost">
                      <DownloadIcon />
                      <span className="sr-only">Download</span>
                    </Button>
                    <Button size="icon" variant="ghost">
                      <AddToChatIcon />
                      <span className="sr-only">AddToChat</span>
                    </Button>
                    <Button size="icon" variant="ghost">
                      <TrashIcon />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return <IconDownload />;
}

function FileIcon() {
  return <IconFile />;
}

function AddToChatIcon() {
  return <IconMessagePlus />;
}

function TrashIcon() {
  return <IconTrash />;
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
