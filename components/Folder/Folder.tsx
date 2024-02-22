import {
  IconCaretDown,
  IconCaretRight,
  IconCheck,
  IconPencil,
  IconPlus,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import {
  KeyboardEvent,
  ReactElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { FolderInterface } from '@/types/folder';

import SidebarActionButton from '@/components/Buttons/SidebarActionButton';
import HomeContext from '@/components/home/home.context';

interface Props {
  currentFolder: FolderInterface;
  searchTerm: string;
  handleDrop: (folder: FolderInterface) => void;
  folderComponent: JSX.Element | null;
}

const Folder = ({
  currentFolder,
  searchTerm,
  handleDrop,
  folderComponent,
}: Props) => {
  const {
    state: { currentDrag },
    handleDeleteFolder,
    handleUpdateFolder,
    setDragData,
    removeDragData,
    handleNewConversation,
  } = useContext(HomeContext);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const buttonRef = useRef<HTMLDivElement>(null);
  const dragEnterTarget = useRef<HTMLElement>();

  const handleEnterDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRename();
    }
  };

  const handleRename = () => {
    handleUpdateFolder(currentFolder.id, renameValue);
    setRenameValue('');
    setIsRenaming(false);
  };

  const handleButtonFocusKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (['Space', 'Enter'].includes(e.code)) {
      setIsOpen(!isOpen);
    }
  };

  const dropHandler = (e: any) => {
    if (currentDrag && currentDrag.type !== 'folder') {
      setIsOpen(true);
      handleDrop(currentFolder);
      if (buttonRef.current) buttonRef.current.style.background = 'none';
    }
  };

  const handleDragStart = () => {
    setDragData({ data: currentFolder, type: 'folder' });
  };

  const allowDrop = (e: any) => {
    e.preventDefault();
  };

  const highlightDrop = (e: any) => {
    dragEnterTarget.current = e.target;
    if (currentDrag && currentDrag.type !== 'folder' && buttonRef.current) {
      buttonRef.current.style.background = '#343541';
    }
  };

  const removeHighlight = (e: any) => {
    if (dragEnterTarget.current === e.target && buttonRef.current)
      buttonRef.current.style.background = 'none';
  };

  useEffect(() => {
    if (isRenaming) {
      setIsDeleting(false);
    } else if (isDeleting) {
      setIsRenaming(false);
    }
  }, [isRenaming, isDeleting]);

  useEffect(() => {
    if (searchTerm) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [searchTerm]);

  return (
    <>
      <div
        className={`
        relative flex items-center
        ${
          !currentDrag ||
          currentDrag.type !== 'folder' ||
          currentDrag.data.id === currentFolder.id
            ? 'pointer-events-auto'
            : 'pointer-events-none'
        }
      `}
      >
        {isRenaming ? (
          <div className="flex w-full items-center gap-3 bg-[#343541]/90 p-3">
            {isOpen ? (
              <IconCaretDown size={18} />
            ) : (
              <IconCaretRight size={18} />
            )}
            <input
              className="mr-12 flex-1 overflow-hidden overflow-ellipsis border-neutral-400 bg-transparent text-left text-[12.5px] leading-3 text-white outline-none focus:border-neutral-100"
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleEnterDown}
              autoFocus
            />
          </div>
        ) : (
          <div
            className={`flex cursor-pointer w-full items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:!bg-[#343541]/90 translate-x-0 z-10`}
            draggable="true"
            onClick={() => setIsOpen(!isOpen)}
            onDrop={dropHandler}
            onDragStart={handleDragStart}
            onDragEnd={removeDragData}
            onDragOver={allowDrop}
            onDragEnter={highlightDrop}
            onDragLeave={removeHighlight}
            onKeyDown={handleButtonFocusKeyDown}
            ref={buttonRef}
            tabIndex={0}
          >
            {isOpen ? (
              <IconCaretDown size={18} />
            ) : (
              <IconCaretRight size={18} />
            )}

            <div className="relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all text-left text-[12.5px] leading-4 pr-12">
              {currentFolder.name}
            </div>
          </div>
        )}

        <div
          className="absolute right-1 z-10 flex text-gray-300"
          onDragOver={allowDrop}
          onDrop={dropHandler}
          onDragEnter={highlightDrop}
          onDragLeave={removeHighlight}
        >
          {(isDeleting || isRenaming) && (
            <>
              <SidebarActionButton
                handleClick={(e) => {
                  e.stopPropagation();

                  if (isDeleting) {
                    handleDeleteFolder(currentFolder.id);
                  } else if (isRenaming) {
                    handleRename();
                  }

                  setIsDeleting(false);
                  setIsRenaming(false);
                }}
              >
                <IconCheck size={18} />
              </SidebarActionButton>
              <SidebarActionButton
                handleClick={(e) => {
                  e.stopPropagation();
                  setIsDeleting(false);
                  setIsRenaming(false);
                }}
              >
                <IconX size={18} />
              </SidebarActionButton>
            </>
          )}

          {!isDeleting && !isRenaming && (
            <>
              <SidebarActionButton
                handleClick={(e) => {
                  e.stopPropagation();
                  handleNewConversation(currentFolder.id);
                  setIsOpen(true);
                }}
              >
                <IconPlus size={18} />
              </SidebarActionButton>
              <SidebarActionButton
                handleClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                  setRenameValue(currentFolder.name);
                }}
              >
                <IconPencil size={18} />
              </SidebarActionButton>
              <SidebarActionButton
                handleClick={(e) => {
                  e.stopPropagation();
                  setIsDeleting(true);
                }}
              >
                <IconTrash size={18} />
              </SidebarActionButton>
            </>
          )}
        </div>
      </div>
      {isOpen ? folderComponent : null}
    </>
  );
};

export default Folder;
