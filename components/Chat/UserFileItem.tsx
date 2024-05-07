import { IconAlertCircleFilled, IconX } from '@tabler/icons-react';
import React, { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useFetchFileList } from '@/hooks/file/useFetchFileList';

import { UserFile } from '@/types/UserFile';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import HomeContext from '../home/home.context';
import UserFileItemIcon from './UserFileItemIcon';

import { cn } from '@/lib/utils';

interface UserFileItemProps {
  file: UserFile;
  onRemove: (file: UserFile) => void;
}

const UserFileItem: React.FC<UserFileItemProps> = ({ file, onRemove }) => {
  const { t } = useTranslation('chat');
  const { data: files } = useFetchFileList();
  const {
    state: { isUltraUser },
  } = useContext(HomeContext);

  const fileExists = useMemo(
    () => files?.some((f) => f.id === file.id),
    [files, file.id],
  );
  const errorTooltipMessage = useMemo(() => {
    if (!isUltraUser) {
      return t(
        'You are not an Ultra user, please upgrade to Ultra to use this Gemini Chat',
      );
    }
    if (!fileExists) {
      return t('This file does not exist, it will be deleted from the chat');
    }
    return '';
  }, [isUltraUser, fileExists, t]);

  if (errorTooltipMessage) {
    return (
      <ErrorTooltip message={errorTooltipMessage}>
        <div
          className={cn(
            'group p-2 border select-none flex gap-2 items-center rounded-md bg-red-100 border-red-500 text-black',
          )}
        >
          <IconAlertCircleFilled className="text-red-500" />
          {file.filename}
          <div className="h-full cursor-pointer group-hover:visible invisible flex items-center">
            <IconX className="" size={14} onClick={() => onRemove(file)} />
          </div>
        </div>
      </ErrorTooltip>
    );
  }

  return (
    <div
      className={cn(
        'group p-2 border select-none flex gap-2 items-center border-gray-500 rounded-md',
      )}
    >
      <UserFileItemIcon fileType={file.filetype} />
      {file.filename}
      <div className="h-full cursor-pointer group-hover:visible invisible flex items-center">
        <IconX className="" size={14} onClick={() => onRemove(file)} />
      </div>
    </div>
  );
};

export default UserFileItem;

function ErrorTooltip({
  message,
  children,
}: {
  message: string;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger>{children}</TooltipTrigger>
        <TooltipContent side="bottom">{message}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
