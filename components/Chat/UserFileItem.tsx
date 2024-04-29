import { IconFile, IconPdf } from '@tabler/icons-react';
import React from 'react';

import { UserFile } from '@/types/UserFile';

interface UserFileItemProps {
  file: UserFile;
}

const UserFileItem: React.FC<UserFileItemProps> = ({ file }) => {
  return (
    <div className="p-2 border select-none flex gap-2 items-center cursor-pointer border-gray-500 rounded-md">
      <FileIcon fileType={file.filetype} />
      {file.filename}
    </div>
  );
};

export default UserFileItem;

interface FileIconProps {
  fileType: string;
}
const FileIcon: React.FC<FileIconProps> = ({ fileType }) => {
  switch (fileType) {
    case 'text/plain':
      return <IconFile />;
    case 'application/pdf':
      return <IconPdf />;
    default:
      return <IconFile />;
  }
};
