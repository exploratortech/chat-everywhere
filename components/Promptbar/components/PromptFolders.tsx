import { useContext, useMemo } from 'react';

import { getNonDeletedCollection } from '@/utils/app/conversation';

import type { FolderInterface } from '@/types/folder';

import Folder from '@/components/Folder';
import { PromptComponent } from '@/components/Promptbar/components/Prompt';
import HomeContext from '@/components/home/home.context';

import PromptbarContext from '../PromptBar.context';

import { cn } from '@/lib/utils';
import { Droppable } from '@hello-pangea/dnd';

export const PromptFolders = () => {
  const {
    state: { currentDrag, folders },
  } = useContext(HomeContext);

  const {
    state: { searchTerm, filteredPrompts },
  } = useContext(PromptbarContext);

  const filteredFolders = useMemo(() => {
    return getNonDeletedCollection(folders).filter(
      (folder) => folder.type === 'prompt',
    );
  }, [folders]);

  const PromptFolder = (currentFolder: FolderInterface) => {
    const refinedFilteredPrompts = filteredPrompts.filter(
      (p) => p.folderId && p.folderId === currentFolder.id,
    );

    return (
      <Droppable
        droppableId={`prompt-folder:${currentFolder.id}`}
        isDropDisabled={currentDrag && currentDrag.type !== 'prompt'}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            className={cn(
              refinedFilteredPrompts.length > 0
                ? 'flex flex-col ml-5 pl-2 border-l py-1 mt-[42px]'
                : 'min-h-[42px]',
              snapshot.isDraggingOver &&
                'bg-[#343541] border-2 border-indigo-400 rounded-lg',
            )}
            {...provided.droppableProps}
          >
            {refinedFilteredPrompts.map((prompt, index) => (
              <PromptComponent
                key={prompt.id}
                prompt={prompt}
                draggableIndex={index}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  };

  return (
    <Droppable
      droppableId="prompt-folder:root"
      isDropDisabled={currentDrag && currentDrag.type !== 'prompt-folder'}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          className={cn(
            'flex w-full flex-col',
            snapshot.isDraggingOver &&
              'overflow-x-hidden bg-[#343541] border-2 border-indigo-400 rounded-lg',
          )}
          {...provided.droppableProps}
        >
          {filteredFolders.map((folder, index) => (
            <Folder
              key={folder.id}
              searchTerm={searchTerm}
              currentFolder={folder}
              folderComponent={PromptFolder(folder)}
              draggableIndex={index}
            />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};
