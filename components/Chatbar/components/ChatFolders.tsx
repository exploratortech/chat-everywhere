import React, { useContext, useMemo } from 'react';

import { getNonDeletedCollection } from '@/utils/app/conversation';

import type { FolderInterface } from '@/types/folder';

import Folder from '@/components/Folder';
import HomeContext from '@/components/home/home.context';

import ChatbarContext from '../Chatbar.context';
import { ConversationComponent } from './Conversation';

import { cn } from '@/lib/utils';
import { Droppable } from '@hello-pangea/dnd';

interface Props {
  searchTerm: string;
}

export const ChatFolders = ({ searchTerm }: Props) => {
  const {
    state: { currentDrag, folders },
  } = useContext(HomeContext);

  const {
    state: { filteredConversations },
  } = useContext(ChatbarContext);

  const filteredFolders = useMemo(() => {
    return getNonDeletedCollection(folders).filter(
      (folder) => folder.type === 'chat',
    );
  }, [folders]);

  const ChatFolder = (currentFolder: FolderInterface) => {
    const refinedFilteredConversations = filteredConversations.filter(
      (conversation) =>
        conversation.folderId && conversation.folderId === currentFolder.id,
    );

    return (
      <Droppable
        droppableId={`chat-folder:${currentFolder.id}`}
        isDropDisabled={currentDrag && currentDrag.type !== currentFolder.type}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            className={cn(
              refinedFilteredConversations.length > 0
                ? 'flex flex-col ml-5 pl-2 border-l py-1 mt-[42px]'
                : 'min-h-[42px]',
              snapshot.isDraggingOver &&
                'overflow-x-hidden bg-[#343541] border-2 border-indigo-400 rounded-lg',
            )}
            {...provided.droppableProps}
          >
            {refinedFilteredConversations.map((conversation, index) => (
              <ConversationComponent
                key={conversation.id}
                conversation={conversation}
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
      droppableId="chat-folder:root"
      isDropDisabled={currentDrag && currentDrag.type !== 'chat-folder'}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          className={cn(
            'flex w-full flex-col',
            snapshot.isDraggingOver &&
              'bg-[#343541] border-2 border-indigo-400 rounded-lg',
          )}
          {...provided.droppableProps}
        >
          {filteredFolders.map((folder, index) => (
            <Folder
              key={folder.id}
              searchTerm={searchTerm}
              currentFolder={folder}
              folderComponent={ChatFolder(folder)}
              draggableIndex={index}
            />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};
