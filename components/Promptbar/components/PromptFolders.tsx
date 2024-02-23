import { Fragment, useContext, useMemo } from 'react';

import { getNonDeletedCollection, updateConversationLastUpdatedAtTimeStamp } from '@/utils/app/conversation';
import { saveFolders } from '@/utils/app/folders';
import { generateRank, reorderItem } from '@/utils/app/rank';

import { Prompt } from '@/types/prompt';
import { FolderInterface } from '@/types/folder';

import HomeContext from '@/components/home/home.context';

import Folder from '@/components/Folder';
import { PromptComponent } from '@/components/Promptbar/components/Prompt';

import PromptbarContext from '../PromptBar.context';
import DropArea from '@/components/DropArea/DropArea';
import { savePrompts } from '@/utils/app/prompts';

export const PromptFolders = () => {
  const {
    state: {
      currentDrag,
      prompts,
      folders,
    },
    dispatch,
  } = useContext(HomeContext);

  const {
    state: {
      searchTerm,
      filteredPrompts,
    },
  } = useContext(PromptbarContext);

  const filteredFolders = useMemo(() => {
    return getNonDeletedCollection(folders)
      .filter((folder) => folder.type === 'prompt');
  }, [folders]);

  const handlePromptDrop = (folder: FolderInterface, index?: number) => {
    if (currentDrag && currentDrag.type === 'prompt') {
      const prompt = currentDrag.data as Prompt;

      // Filter for prompts that are in the folder
      const refinedFilteredPrompts = filteredPrompts
        .filter((p) => p.folderId === folder.id);

      const updatedPrompts = reorderItem(
        prompts,
        prompt.id,
        generateRank(refinedFilteredPrompts, index),
        { updates: { folderId: folder.id } },
      );

      dispatch({ field: 'prompts', value: updatedPrompts });
      savePrompts(updatedPrompts);
      updateConversationLastUpdatedAtTimeStamp();
    }
  };

  const handleCanDropPrompt = (): boolean => {
    return (!!currentDrag && currentDrag.type === 'prompt');
  };

  const handleFolderDrop = (e: React.DragEvent<HTMLElement>, index: number) => {
    if (currentDrag && currentDrag.type === 'folder') {
      const folder = currentDrag.data as FolderInterface;
      if (folder.type !== 'prompt') return;
      const reorderedFolders = reorderItem(
        folders,
        folder.id,
        generateRank(filteredFolders, index),
        { filter: (folder: FolderInterface) => folder.type === 'prompt' },
      );
      dispatch({ field: 'folders', value: reorderedFolders });
      saveFolders(reorderedFolders);
    }
    e.stopPropagation();
  };

  const handleCanDropFolder = (): boolean => {
    return (
      !!currentDrag &&
      currentDrag.type === 'folder' &&
      (currentDrag.data as FolderInterface).type === 'prompt'
    );
  };

  const PromptFolders = (currentFolder: FolderInterface) => {
    const refinedFilteredPrompts = filteredPrompts
      .filter((p) => p.folderId === currentFolder.id);

    if (!refinedFilteredPrompts.length) {
      return null;
    }

    return (
      <div className="flex flex-col ml-5 pl-2 border-l py-1">
        <DropArea
          allowedDragTypes={['prompt']}
          canDrop={handleCanDropPrompt}
          index={0}
          onDrop={() => handlePromptDrop(currentFolder, 0)}
        />
        {refinedFilteredPrompts.map((prompt, index) => {
            if (prompt.folderId === currentFolder.id) {
              return (
                <Fragment key={prompt.id}>
                  <PromptComponent prompt={prompt} />
                  <DropArea
                    allowedDragTypes={['prompt']}
                    canDrop={handleCanDropPrompt}
                    index={index + 1}
                    onDrop={() => handlePromptDrop(currentFolder, index + 1)}
                  />
                </Fragment>
              );
            }
          }
        )}
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col pt-2">
      <DropArea
        allowedDragTypes={['folder']}
        canDrop={handleCanDropFolder}
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
            canDrop={handleCanDropFolder}
            index={index + 1}
            onDrop={(e) => handleFolderDrop(e, index + 1)}
          />
        </Fragment>
      ))}
    </div>
  );
};
