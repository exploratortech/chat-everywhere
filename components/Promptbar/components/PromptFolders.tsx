import { Fragment, useContext, useMemo } from 'react';

import { getNonDeletedCollection } from '@/utils/app/conversation';
import { saveFolders } from '@/utils/app/folders';
import { generateRank, reorderItem } from '@/utils/app/rank';

import { Prompt } from '@/types/prompt';
import { FolderInterface } from '@/types/folder';

import HomeContext from '@/pages/api/home/home.context';

import Folder from '@/components/Folder';
import { PromptComponent } from '@/components/Promptbar/components/Prompt';

import PromptbarContext from '../PromptBar.context';
import DropArea from '@/components/DropArea/DropArea';

export const PromptFolders = () => {
  const {
    state: {
      currentDrag,
      folders,
    },
    dispatch,
  } = useContext(HomeContext);

  const {
    state: { searchTerm, filteredPrompts },
    handleUpdatePrompt,
  } = useContext(PromptbarContext);

  const filteredFolders = useMemo(() => {
    return getNonDeletedCollection(folders)
      .filter((folder) => folder.type === 'prompt');
  }, [folders]);

  const handlePromptDrop = (folder: FolderInterface) => {
    if (currentDrag && currentDrag.type === 'prompt') {
      const prompt = currentDrag.data as Prompt;

      const updatedPrompt = {
        ...prompt,
        folderId: folder.id,
      };

      handleUpdatePrompt(updatedPrompt);
    }
  };

  const handleFolderDrop = (e: React.DragEvent<HTMLElement>, index: number) => {
    if (currentDrag && currentDrag.type === 'folder') {
      const folder = currentDrag.data as FolderInterface;
      if (folder.type !== 'prompt') return;
      const reorderedFolders = reorderItem(
        folders,
        folder.id,
        generateRank(filteredFolders, index),
        (folder: FolderInterface) => folder.type === 'prompt',
      );
      dispatch({ field: 'folders', value: reorderedFolders });
      saveFolders(reorderedFolders);
    }
    e.stopPropagation();
  };

  const handleCanDrop = (): boolean => {
    return (
      !!currentDrag &&
      currentDrag.type === 'folder' &&
      (currentDrag.data as FolderInterface).type === 'prompt'
    );
  };

  const PromptFolders = (currentFolder: FolderInterface) =>
    filteredPrompts
      .filter((p) => p.folderId)
      .map((prompt) => {
        if (prompt.folderId === currentFolder.id) {
          return (
            <div key={prompt.id} className="ml-5 gap-2 border-l pl-2">
              <PromptComponent prompt={prompt} />
            </div>
          );
        }
      });

  return (
    <div className="flex w-full flex-col pt-2">
      <DropArea
        allowedDragTypes={['folder']}
        canDrop={handleCanDrop}
        index={0}
        onDrop={(e) => handleFolderDrop(e, 0)}
      />
      {filteredFolders.map((folder, index) => (
        <Fragment key={folder.id}>
          <Folder
            searchTerm={searchTerm}
            currentFolder={folder}
            handleDrop={handlePromptDrop}
            folderComponent={PromptFolders(folder)}
          />
          <DropArea
            allowedDragTypes={['folder']}
            canDrop={handleCanDrop}
            index={index + 1}
            onDrop={(e) => handleFolderDrop(e, index + 1)}
          />
        </Fragment>
      ))}
    </div>
  );
};
