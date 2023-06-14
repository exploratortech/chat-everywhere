import { Fragment, useContext } from 'react';

import { getNonDeletedCollection } from '@/utils/app/conversation';
import { generateFolderRank } from '@/utils/app/folders';

import { FolderInterface } from '@/types/folder';

import HomeContext from '@/pages/api/home/home.context';

import Folder from '@/components/Folder';
import { PromptComponent } from '@/components/Promptbar/components/Prompt';

import PromptbarContext from '../PromptBar.context';
import DropArea from '@/components/DropArea/DropArea';

export const PromptFolders = () => {
  const {
    state: { folders },
    handleReorderFolder,
  } = useContext(HomeContext);

  const {
    state: { searchTerm, filteredPrompts },
    handleUpdatePrompt,
  } = useContext(PromptbarContext);

  const handlePromptDrop = (e: any, folder: FolderInterface) => {
    if (e.dataTransfer && e.dataTransfer.getData('prompt')) {
      const prompt = JSON.parse(e.dataTransfer.getData('prompt'));

      const updatedPrompt = {
        ...prompt,
        folderId: folder.id,
      };

      handleUpdatePrompt(updatedPrompt);
    }
  };

  const handleFolderDrop = (e: any, index: number) => {
    if (e.dataTransfer && e.dataTransfer.getData('folder')) {
      const folder: FolderInterface = JSON.parse(e.dataTransfer.getData('folder'));
      handleReorderFolder(
        folder.id,
        generateFolderRank(folders, index),
      );
    }
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
        index={0}
        onDrop={handleFolderDrop}
      />
      {getNonDeletedCollection(folders)
        .filter((folder) => folder.type === 'prompt')
        .map((folder, index) => (
          <Fragment key={index}>
            <Folder
              searchTerm={searchTerm}
              currentFolder={folder}
              handleDrop={handlePromptDrop}
              folderComponent={PromptFolders(folder)}
            />
            <DropArea
              index={index + 1}
              onDrop={handleFolderDrop}
            />
          </Fragment>
        ))}
    </div>
  );
};
