import { IconCheck, IconDownload, IconFile, IconPencil, IconTrash, IconX } from "@tabler/icons-react";
import { KeyboardEvent, MouseEventHandler, useContext, useEffect, useRef, useState } from "react";

import SidebarActionButton from "../Buttons/SidebarActionButton/SidebarActionButton";
import AttachmentsModelContext from "./AttachmentsModel.context";
import { Attachment } from "@/types/attachment";
import prettyBytes from "pretty-bytes";

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
    <div
      className="relative flex flex-row justify-between items-center gap-3 p-3 cursor-pointer rounded-lg bg-transparent hover:bg-[#343541]/90 transition-colors duration-200"
      onClick={(e) => {
        e.stopPropagation();
        if (!isDeleting && !isRenaming) {
          downloadFile();
        }
      }}
      onKeyDown={handleButtonFocusKeyDown}
      tabIndex={0}
    >
      <div className="flex flex-row flex-grow flex-shrink items-center min-w-0 gap-3">
        <IconFile
          className="flex-shrink-0"
          size={18}
        />
        {isRenaming ? (
          <input
            className="flex-1 flex-shrink min-w-0 border-neutral-400 bg-transparent text-left text-sm text-white outline-none focus:border-neutral-100"
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            autoFocus
            ref={inputRef}
          />
        ) : (
          <p className="text-sm text-left text-ellipsis overflow-hidden select-none">
            {attachment.name}
          </p>
        )}
      </div>

      {(isDeleting || isRenaming) && (
        <div className="flex flex-row flex-shrink-0 items-center space-x-2 text-gray-300">
          <SidebarActionButton handleClick={handleConfirmButtonClick}>
            <IconCheck size={18} />
          </SidebarActionButton>

          <SidebarActionButton handleClick={handleCancelButtonClick}>
            <IconX size={18} />
          </SidebarActionButton>
        </div>
      )}

      {!isDeleting && !isRenaming && (
        <div className="flex flex-row flex-shrink-0 items-center gap-2 mr-2 text-gray-300">
          <p className="mr-2 text-sm text-neutral-400 whitespace-nowrap">
            {prettyBytes(attachment.size) || '--'}
          </p>
          <div className="flex flex-row items-center gap-2">
            <SidebarActionButton handleClick={(e) => {
              e.stopPropagation();
              downloadFile();
            }}>
              <IconDownload size={18} />
            </SidebarActionButton>
            <SidebarActionButton handleClick={handleRenameButtonClick}>
              <IconPencil size={18} />
            </SidebarActionButton>
            <SidebarActionButton handleClick={handleDeleteButtonClick}>
              <IconTrash size={18} />
            </SidebarActionButton>
          </div>
        </div>
      )}
    </div>
  );
}