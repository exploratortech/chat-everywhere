import React, { Fragment, useContext, useMemo } from 'react';

import { getNonDeletedCollection, saveConversations, updateConversationLastUpdatedAtTimeStamp } from '@/utils/app/conversation';
import { saveFolders } from '@/utils/app/folders';
import { generateRank, reorderItem } from '@/utils/app/rank';

import { FolderInterface } from '@/types/folder';
import { Conversation } from '@/types/chat';

import HomeContext from '@/components/home/home.context';

import Folder from '@/components/Folder';
import DropArea from '@/components/DropArea/DropArea';

import { ConversationComponent } from './Conversation';
import ChatbarContext from '../Chatbar.context';

interface Props {
  searchTerm: string;
}

export const ChatFolders = ({ searchTerm }: Props) => {
  const {
    state: {
      conversations,
      currentDrag,
      folders,
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

  const handleConversationDrop = (folder: FolderInterface, index?: number): void => {
    if (currentDrag && currentDrag.type === 'conversation') {
      const conversation = currentDrag.data as Conversation;

      const filter = (otherConversation: Conversation) =>
        otherConversation.folderId === folder.id;
      const refinedFilteredConversations = filteredConversations.filter(filter);

      const updatedConversations = reorderItem(
        conversations,
        conversation.id,
        generateRank(refinedFilteredConversations, index),
        {
          filter,
          updates: { folderId: folder.id },
        }
      );

      dispatch({ field: 'conversations', value: updatedConversations });
      saveConversations(updatedConversations);
      updateConversationLastUpdatedAtTimeStamp();
    }
  };

  const handleCanDropConversation = (): boolean => {
    return (!!currentDrag && currentDrag.type === 'conversation');
  };

  const handleFolderDrop = (e: React.DragEvent<HTMLElement>, index: number) => {
    if (currentDrag && currentDrag.type === 'folder') {
      const folder: FolderInterface = currentDrag.data as FolderInterface;
      if (folder.type !== 'chat') return;
      const reorderedFolders = reorderItem(
        folders,
        folder.id,
        generateRank(filteredFolders, index),
        { filter: (folder: FolderInterface) => folder.type === 'chat' },
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
      (currentDrag.data as FolderInterface).type === 'chat'
    );
  };

  const ChatFolders = (currentFolder: FolderInterface) => {
    const refinedFilteredConversations = filteredConversations
      .filter((conversation) =>
        conversation.folderId && conversation.folderId === currentFolder.id
      );

    if (!refinedFilteredConversations.length) {
      return null;
    }

    return (
      <div className="flex flex-col ml-5 pl-2 border-l py-1">
        <DropArea
          allowedDragTypes={['conversation']}
          canDrop={handleCanDropConversation}
          index={0}
          onDrop={() => handleConversationDrop(currentFolder, 0)}
        />
        {refinedFilteredConversations.map((conversation, index) => (
          <Fragment key={conversation.id}>
            <ConversationComponent conversation={conversation} />
            <DropArea
              allowedDragTypes={['conversation']}
              canDrop={handleCanDropConversation}
              index={index + 1}
              onDrop={() => handleConversationDrop(currentFolder, index + 1)}
            />
          </Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col">
      <DropArea
        allowedDragTypes={['folder']}
        canDrop={handleCanDropFolder}
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
            canDrop={handleCanDropFolder}
            index={index + 1}
            onDrop={(e) => handleFolderDrop(e, index + 1)}
          />
        </Fragment>
      ))}
    </div>
  );
};
