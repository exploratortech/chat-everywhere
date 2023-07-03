import React, { Fragment, useContext, useMemo } from 'react';

import { getNonDeletedCollection } from '@/utils/app/conversation';
import { saveFolders } from '@/utils/app/folders';
import { generateRank, reorderItem } from '@/utils/app/rank';

import { FolderInterface } from '@/types/folder';
import { Conversation } from '@/types/chat';

import HomeContext from '@/pages/api/home/home.context';

import Folder from '@/components/Folder';

import { ConversationComponent } from './Conversation';
import DropArea from '@/components/DropArea/DropArea';
import ChatbarContext from '../Chatbar.context';

interface Props {
  searchTerm: string;
}

export const ChatFolders = ({ searchTerm }: Props) => {
  const {
    state: {
      folders,
      currentDrag,
    },
    dispatch,
    handleUpdateConversation,
  } = useContext(HomeContext);

  const {
    state: { filteredConversations },
  } = useContext(ChatbarContext);

  const filteredFolders = useMemo(() => {
    return getNonDeletedCollection(folders)
      .filter((folder) => folder.type === 'chat');
  }, [folders]);

  const handleConversationDrop = (folder: FolderInterface) => {
    if (currentDrag && currentDrag.type === 'conversation') {
      const conversation = currentDrag.data as Conversation;
      handleUpdateConversation(conversation, {
        key: 'folderId',
        value: folder.id,
      });
    }
  };

  const handleFolderDrop = (e: React.DragEvent<HTMLElement>, index: number) => {
    if (currentDrag && currentDrag.type === 'folder') {
      const folder: FolderInterface = currentDrag.data as FolderInterface;
      if (folder.type !== 'chat') return;
      const reorderedFolders = reorderItem(
        folders,
        folder.id,
        generateRank(filteredFolders, index),
        (folder: FolderInterface) => folder.type === 'chat',
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
      (currentDrag.data as FolderInterface).type === 'chat'
    );
  };

  const ChatFolders = (currentFolder: FolderInterface) => {
    return (
      filteredConversations
        .filter((conversation) =>
          conversation.folderId && conversation.folderId === currentFolder.id
        ).map((conversation) => (
          <div key={conversation.id} className="ml-5 gap-2 border-l pl-2 item">
            <ConversationComponent conversation={conversation} />
          </div>
        ))
    );
  };

  return (
    <div className="flex w-full flex-col">
      <DropArea
        allowedDragTypes={['folder']}
        canDrop={handleCanDrop}
        index={0}
        onDrop={(e) => handleFolderDrop(e, 0)}
      />
      {filteredFolders.map((folder, index) => (
        <Fragment key={folder.id}>
          <Folder
            key={folder.id}
            searchTerm={searchTerm}
            currentFolder={folder}
            handleDrop={handleConversationDrop}
            folderComponent={ChatFolders(folder)}
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
