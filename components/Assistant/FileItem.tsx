import { IconCheck, IconDotsVertical, IconDownload, IconFile, IconPencil, IconTrash, IconX } from "@tabler/icons-react";
import { Fragment, KeyboardEvent, MouseEvent, MouseEventHandler, PropsWithChildren, useContext, useEffect, useRef, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import prettyBytes from "pretty-bytes";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import SidebarActionButton from "../Buttons/SidebarActionButton/SidebarActionButton";
import FilesModalContext from "./FilesModal.context";
import { UploadedFile } from "@/types/uploadedFile";

dayjs.extend(relativeTime);

type Props = {
  file: UploadedFile;
}

export function FileItem({ file }: Props): JSX.Element {
  const {
    deleteFile,
    renameFile,
    downloadFile,
  } = useContext(FilesModalContext);

  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [renameValue, setRenameValue] = useState<string>(file.name);

  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation('model');

  const handleDeleteButtonClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    setIsDeleting(true);
  };

  const handleRenameButtonClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    setIsRenaming(true);
  };

  const handleConfirmButtonClick: MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.stopPropagation();
    if (isDeleting) {
      deleteFile(file.name);
      setIsDeleting(false);
    } else if (isRenaming && await renameFile(file.name, renameValue)) {
      setIsRenaming(false);
    }
  };

  const handleCancelButtonClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    setIsDeleting(false);
    setIsRenaming(false);
    setRenameValue(file.name);
  };

  const handleInputKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.code === 'Enter' && await renameFile(file.name, renameValue)) {
      setIsRenaming(false);
    }
  };

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      const filename: string | undefined = file.name.match(/(.+?)\.[^.]*$|$/)![1];
      inputRef.current.setSelectionRange(0, filename?.length || 0);
    }
  }, [isRenaming, file.name]);

  useEffect(() => {
    setRenameValue(file.name);
  }, [file.name]);

  return (
    <Menu
      as="div"
      className="relative flex flex-row flex-grow flex-shrink items-center min-w-0 gap-3 p-3 select-none"
    >
      <IconFile
        className="flex-shrink-0"
        size={18}
      />
      {isRenaming ? (
        <input
          className="flex-1 min-w-0 border-neutral-400 bg-transparent text-left text-sm text-white outline-none focus:border-neutral-100 pointer-events-auto"
          type="text"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          autoFocus
          ref={inputRef}
        />
      ) : (
        <p className="flex-1 text-sm text-left text-ellipsis overflow-hidden">
          {file.name}
        </p>
      )}
      
      {(isDeleting || isRenaming) && (
        <div className="flex flex-row flex-shrink-0 items-center space-x-2 text-gray-300 pointer-events-auto">
          <SidebarActionButton handleClick={handleConfirmButtonClick}>
            <IconCheck size={18} />
          </SidebarActionButton>
          <SidebarActionButton handleClick={handleCancelButtonClick}>
            <IconX size={18} />
          </SidebarActionButton>
        </div>
      )}

      {!isDeleting && !isRenaming && (
        <div className="flex flex-row flex-shrink-0 items-center gap-2 text-gray-300">
          <p className="block mobile:hidden text-sm text-neutral-400 whitespace-nowrap">
            {dayjs(file.updatedAt).fromNow()}
          </p>
          <p className="w-20 mr-2 text-sm text-right text-neutral-400 whitespace-nowrap">
            {prettyBytes(file.size, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) || '--'}
          </p>
          <div className="flex tablet:hidden flex-row items-center gap-2 pointer-events-auto">
            <SidebarActionButton handleClick={(e) => {
              e.stopPropagation();
              downloadFile(file.name);
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
          <Menu.Button
            className="hidden tablet:block p-1 pointer-events-auto"
            onClick={(event) => {
              event.stopPropagation();
              setTimeout(() => {
                if (menuRef.current) {
                  menuRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 100);
            }}
          >
            <IconDotsVertical size={18} />
          </Menu.Button>
        </div>
      )}
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className="absolute top-full right-0 w-56 p-2 rounded-md bg-[#202123] drop-shadow-xl focus:outline-none z-10"
          onClick={(event) => event.stopPropagation()}
        >
          <div ref={menuRef}>
            <MenuItemButton
              onClick={(event) => {
                event.stopPropagation();
                downloadFile(file.name);
              }}
            >
              <IconDownload size={18} />
              {t('Download')}
            </MenuItemButton>
            <MenuItemButton
              onClick={handleRenameButtonClick}
            >
              <IconPencil size={18} />
              {t('Rename')}
            </MenuItemButton>
            <MenuItemButton
              onClick={handleDeleteButtonClick}
            >
              <IconTrash size={18} />
              {t('Delete')}
            </MenuItemButton>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

type MenuItemButtonProps = {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
} & PropsWithChildren;

function MenuItemButton({ children, onClick }: MenuItemButtonProps): JSX.Element {
  return (
    <Menu.Item>
      {({ active }) => (
        <button
          className={`
            ${ active ? 'bg-[#343541]/90 text-white' : 'text-gray-300' }
            flex w-full items-center rounded-md p-2 text-sm `
          }
          onClick={onClick}
        >
          <div className="flex flex-row items-center gap-2">
            {children}
          </div>
        </button>
      )}
    </Menu.Item>
  )
}
