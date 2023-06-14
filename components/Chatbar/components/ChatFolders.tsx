import React, { Fragment, useContext } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import { getNonDeletedCollection } from '@/utils/app/conversation';

import { FolderInterface } from '@/types/folder';

import HomeContext from '@/pages/api/home/home.context';

import Folder from '@/components/Folder';

import { ConversationComponent } from './Conversation';
import DropArea from '@/components/DropArea/DropArea';
import { generateFolderRank } from '@/utils/app/folders';

interface Props {
  searchTerm: string;
}

export const ChatFolders = ({ searchTerm }: Props) => {
  const {
    state: { folders, conversations },
    handleUpdateConversation,
    handleReorderFolder,
  } = useContext(HomeContext);

  const handleConversationDrop = (e: any, folder: FolderInterface) => {
    if (e.dataTransfer) {
      const conversation = JSON.parse(e.dataTransfer.getData('conversation'));
      handleUpdateConversation(conversation, {
        key: 'folderId',
        value: folder.id,
      });
    }
  };

  const handleFolderDrop = (e: any, index: number) => {
    if (e.dataTransfer && e.dataTransfer.getData('folder')) {
      const folder: FolderInterface = JSON.parse(e.dataTransfer.getData('folder'));
      if (folder.type !== 'chat') return;
      handleReorderFolder(
        folder.id,
        generateFolderRank(folders, 'chat', index),
        'chat',
      );
    }
  };

  const ChatFolders = (currentFolder: FolderInterface) => {
    return (
      conversations &&
      conversations
        .filter(
          (conversation) =>
            conversation.folderId && conversation.folderId === currentFolder.id,
        )
        .map((conversation, index) => (
          <div key={conversation.id} className="ml-5 gap-2 border-l pl-2 item">
            <ConversationComponent
              key={conversation.id}
              conversation={conversation}
            />
          </div>
        ))
    );
  };

  return (
    <TransitionGroup className="flex w-full flex-col pt-2">
      <DropArea
        index={0}
        onDrop={handleFolderDrop}
      />
      {getNonDeletedCollection(folders)
        .filter((folder) => folder.type === 'chat')
        .map((folder, index) => (
          <Fragment key={folder.id}>
            <CSSTransition timeout={500} classNames="item">
              <Folder
                key={folder.id}
                searchTerm={searchTerm}
                currentFolder={folder}
                handleDrop={handleConversationDrop}
                folderComponent={ChatFolders(folder)}
              />
            </CSSTransition>
            <DropArea
              index={index + 1}
              onDrop={handleFolderDrop}
            />
          </Fragment>
        ))}
    </TransitionGroup>
  );
};
