import { IconAlertCircleFilled, IconX } from '@tabler/icons-react';
import React, { useContext, useMemo } from 'react';

import { useFetchFileList } from '@/hooks/file/useFetchFileList';

import { UserFile } from '@/types/UserFile';

import HomeContext from '../home/home.context';
import UserFileItemIcon from './UserFileItemIcon';

import { cn } from '@/lib/utils';

interface UserFileItemProps {
  file: UserFile;
  onRemove: (file: UserFile) => void;
}

const UserFileItem: React.FC<UserFileItemProps> = ({ file, onRemove }) => {
  const { data: files } = useFetchFileList();
  const {
    state: { isUltraUser },
  } = useContext(HomeContext);

  const fileExists = useMemo(
    () => files?.some((f) => f.id === file.id),
    [files, file.id],
  );
  const fileCannotBeUsed = useMemo(
    () => !isUltraUser || !fileExists,
    [isUltraUser, fileExists],
  );
  return (
    <div
      className={cn(
        'group p-2 border select-none flex gap-2 items-center border-gray-500 rounded-md',
        fileCannotBeUsed ? 'bg-red-100 border-red-500 text-black' : '',
      )}
    >
      {fileCannotBeUsed ? (
        <IconAlertCircleFilled className="text-red-500" />
      ) : (
        <UserFileItemIcon fileType={file.filetype} />
      )}

      {file.filename}
      <div className="h-full cursor-pointer group-hover:visible invisible flex items-center">
        <IconX className="" size={14} onClick={() => onRemove(file)} />
      </div>
    </div>
  );
};

export default UserFileItem;
