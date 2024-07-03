import {
  IconCaretDown,
  IconCaretRight,
  IconCheck,
  IconMessagePlus,
  IconPencil,
  IconPlus,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { KeyboardEvent, useContext, useEffect, useRef, useState } from 'react';

import { FolderInterface } from '@/types/folder';

import SidebarActionButton from '@/components/Buttons/SidebarActionButton';
import HomeContext from '@/components/home/home.context';

import { cn } from '@/lib/utils';
import { Draggable, Droppable } from '@hello-pangea/dnd';

interface Props {
  currentFolder: FolderInterface;
  searchTerm: string;
  folderComponent: JSX.Element | null;
  draggableIndex: number;
}

const Folder = ({
  currentFolder,
  searchTerm,
  folderComponent,
  draggableIndex,
}: Props) => {
  const {
    state: { currentDrag },
    handleDeleteFolder,
    handleUpdateFolder,
    handleNewConversation,
    handleCreatePrompt,
  } = useContext(HomeContext);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const buttonRef = useRef<HTMLDivElement>(null);

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
    <Draggable
      draggableId={`${currentFolder.type}-folder:${currentFolder.id}`}
      index={draggableIndex}
      isDragDisabled={isRenaming || isDeleting}
    >
      {(provided) => (
        <div
          className="relative w-full rounded-lg overflow-hidden"
          {...provided.dragHandleProps}
          {...provided.draggableProps}
          ref={provided.innerRef}
        >
          <div className="absolute top-0 left-0 right-0 flex items-center">
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
                onClick={() => setIsOpen(!isOpen)}
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
            <div className="absolute right-1 z-10 flex text-gray-300">
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
                      switch (currentFolder.type) {
                        case 'chat':
                          handleNewConversation(currentFolder.id);
                        case 'prompt':
                          handleCreatePrompt(currentFolder.id);
                      }
                      setIsOpen(true);
                    }}
                  >
                    {currentFolder.type === 'chat' ? (
                      <IconMessagePlus size={18} />
                    ) : (
                      <IconPlus size={18} />
                    )}
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
          {isOpen ? (
            folderComponent
          ) : (
            <Droppable
              droppableId={`${currentFolder.type}-folder:${currentFolder.id}`}
              isDropDisabled={
                currentDrag && currentDrag.type !== currentFolder.type
              }
            >
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  className={cn(
                    'min-h-[42px]',
                    snapshot.isDraggingOver &&
                      'overflow-x-hidden bg-[#343541] border-2 border-indigo-400 rounded-lg',
                  )}
                  {...provided.droppableProps}
                >
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default Folder;
