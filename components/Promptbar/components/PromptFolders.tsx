import { Fragment, useContext } from 'react';

import { getNonDeletedCollection } from '@/utils/app/conversation';
import { generateFolderRank } from '@/utils/app/folders';
import { RANK_INTERVAL } from '@/utils/app/const';

import { FolderInterface } from '@/types/folder';

import HomeContext from '@/pages/api/home/home.context';

import Folder from '@/components/Folder';
import { PromptComponent } from '@/components/Promptbar/components/Prompt';

import PromptbarContext from '../PromptBar.context';
import PromptFolderDropArea from './PromptFolderDropArea';

export const PromptFolders = () => {
  const {
    state: { folders },
    handleUpdateFolder,
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
      handleUpdateFolder(
        folder.id,
        folder.name,
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
      <PromptFolderDropArea
        index={0}
        handleFolderDrop={handleFolderDrop}
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
            <PromptFolderDropArea
              index={index + 1}
              handleFolderDrop={handleFolderDrop}
            />
          </Fragment>
        ))}
    </div>
  );
};
