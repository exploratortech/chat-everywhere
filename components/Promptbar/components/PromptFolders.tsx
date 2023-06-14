import { Fragment, useContext } from 'react';

import { getNonDeletedCollection } from '@/utils/app/conversation';
import { generateFolderRank } from '@/utils/app/folders';

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
    handleReorderFolder,
  } = useContext(HomeContext);

  const {
    state: { searchTerm, filteredPrompts },
    handleUpdatePrompt,
  } = useContext(PromptbarContext);

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

  const handleFolderDrop = (index: number) => {
    if (currentDrag && currentDrag.type === 'folder') {
      const folder = currentDrag.data as FolderInterface;
      if (folder.type !== 'prompt') return;
      handleReorderFolder(
        folder.id,
        generateFolderRank(folders, folder.type, index),
        'prompt',
      );
    }
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
      .map((prompt, index) => {
        if (prompt.folderId === currentFolder.id) {
          return (
            <div key={index} className="ml-5 gap-2 border-l pl-2">
              <PromptComponent prompt={prompt} />
            </div>
          );
        }
      });

  return (
    <div className="flex w-full flex-col pt-2">
      <DropArea
        canDrop={handleCanDrop}
        index={0}
        onDrop={handleFolderDrop}
      />
      {getNonDeletedCollection(folders)
        .filter((folder) => folder.type === 'prompt')
        .map((folder, index) => (
          <Fragment key={folder.id}>
            <Folder
              searchTerm={searchTerm}
              currentFolder={folder}
              handleDrop={handlePromptDrop}
              folderComponent={PromptFolders(folder)}
            />
            <DropArea
              canDrop={handleCanDrop}
              index={index + 1}
              onDrop={handleFolderDrop}
            />
          </Fragment>
        ))}
    </div>
  );
};
