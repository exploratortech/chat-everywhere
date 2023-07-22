import { IconCheck, IconDownload, IconFile, IconPencil, IconTrash, IconX } from "@tabler/icons-react";
import { KeyboardEvent, MouseEventHandler, useContext, useEffect, useRef, useState } from "react";

import SidebarActionButton from "../Buttons/SidebarActionButton/SidebarActionButton";

import AttachmentsModelContext from "./AttachmentsModel.context";
import { Attachment } from "@/types/attachment";

type Props = {
  attachment: Attachment;
}

export const AttachmentItem = ({ attachment }: Props): JSX.Element => {
  const {
    deleteAttachment,
    renameAttachment,
  } = useContext(AttachmentsModelContext);

  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [renameValue, setRenameValue] = useState<string>(attachment.name);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleDeleteButtonClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    setIsDeleting(true);
  };

  const handleRenameButtonClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    setIsRenaming(true);
  };

  const handleConfirmButtonClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    if (isDeleting && deleteAttachment(attachment.name)) {
      setIsDeleting(false);
    } else if (isRenaming && renameAttachment(attachment.name, renameValue)) {
      setIsRenaming(false);
    }
  };

  const handleCancelButtonClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    setIsDeleting(false);
    setIsRenaming(false);
    setRenameValue(attachment.name);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.code === 'Enter' && renameAttachment(attachment.name, renameValue)) {
      setIsRenaming(false);
    }
  };

  const handleButtonFocusKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (["Space", "Enter"].includes(e.code)) {
      downloadFile();
    }
  };

  const downloadFile = (): void => {
    const link = document.createElement('a');
    const blob = new Blob([attachment.content], { type: attachment.type });
    link.href = window.URL.createObjectURL(blob);
    link.download = attachment.name;
    link.click();
  };

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      const filename: string | undefined = attachment.name.match(/(.+?)\.[^.]*$|$/)![1];
      inputRef.current.setSelectionRange(0, filename?.length || 0);
    }
  }, [isRenaming, attachment.name]);

  useEffect(() => {
    setRenameValue(attachment.name);
  }, [attachment.name]);

  return (
    <div className="relative flex items-center">
      {isRenaming ? (
        <div className="flex w-full items-center gap-3 rounded-lg bg-[#343541]/90 p-3">
          <IconFile size={18} />
          <input
            className="mr-12 flex-1 overflow-hidden overflow-ellipsis border-neutral-400 bg-transparent text-left text-[12.5px] leading-3 text-white outline-none focus:border-neutral-100"
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            autoFocus
            ref={inputRef}
          />
        </div>
      ) : (
        <div
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:bg-[#343541]/90"
          onClick={(e) => {
            e.stopPropagation();
            downloadFile();
          }}
          onKeyDown={handleButtonFocusKeyDown}
          tabIndex={0}
        >
          <IconFile size={18} />
          <div
            className={`
              ${ isRenaming ? 'pr-12' : 'pr-4' }
              relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all text-left text-[12.5px]`
            }
          >
            {attachment.name}
          </div>
        </div>
      )}

      {(isDeleting || isRenaming) && (
        <div className="absolute right-2 z-10 flex flex-row space-x-2 text-gray-300">
          <SidebarActionButton handleClick={handleConfirmButtonClick}>
            <IconCheck size={18} />
          </SidebarActionButton>

          <SidebarActionButton handleClick={handleCancelButtonClick}>
            <IconX size={18} />
          </SidebarActionButton>
        </div>
      )}

      {!isDeleting && !isRenaming && (
        <div className="absolute right-2 z-10 flex flex-row space-x-2 text-gray-300">
          <SidebarActionButton handleClick={downloadFile}>
            <IconDownload size={18} />
          </SidebarActionButton>
          <SidebarActionButton handleClick={handleRenameButtonClick}>
            <IconPencil size={18} />
          </SidebarActionButton>
          <SidebarActionButton handleClick={handleDeleteButtonClick}>
            <IconTrash size={18} />
          </SidebarActionButton>
        </div>
      )}
    </div>
  );
}