import { IconFile, IconPdf, IconX } from '@tabler/icons-react';
import React from 'react';

import { UserFile } from '@/types/UserFile';

interface UserFileItemProps {
  file: UserFile;
  onRemove: (file: UserFile) => void;
}

const UserFileItem: React.FC<UserFileItemProps> = ({ file, onRemove }) => {
  return (
    <div className="group p-2 border select-none flex gap-2 items-center border-gray-500 rounded-md">
      <FileIcon fileType={file.filetype} />
      {file.filename}
      <div className="h-full cursor-pointer group-hover:visible invisible flex items-center">
        <IconX className="" size={14} onClick={() => onRemove(file)} />
      </div>
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
