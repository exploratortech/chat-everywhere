import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import {
  saveConversations,
  updateConversationLastUpdatedAtTimeStamp,
} from '@/utils/app/conversation';
import { saveFolders } from '@/utils/app/folders';
import { savePrompts } from '@/utils/app/prompts';
import { reorderFolder, reorderItem } from '@/utils/app/rank';

import { DragDataType } from '@/types/drag';

import HomeContext from '../home/home.context';

import {
  DragDropContext as Component,
  DragStart,
  DropResult,
} from '@hello-pangea/dnd';
import dayjs from 'dayjs';

export const DragDropContext = ({ children }: PropsWithChildren) => {
  const {
    state: { conversations, prompts, folders, currentDrag },
    setDragData,
    removeDragData,
    dispatch,
  } = useContext(HomeContext);

  const onDragStart = useCallback(
    (start: DragStart) => {
      // We're storing the item type and its id in the draggable id.
      const { draggableId } = start;
      const [itemType, itemId] = draggableId.split(':');

      if (!itemType || !itemId) {
        throw new Error('Item missing "itemType" or "itemId"');
      }

      setDragData({ id: itemId, type: itemType as DragDataType });
    },
    [setDragData],
  );

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source } = result;

      if (!destination || !currentDrag) return;

      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      // Retrieve the drop location which will either be a folder or
      // nothing (null).
      const [_, droppableId] = destination.droppableId.split(':');
      const folder = folders.find((folder) => folder.id === droppableId);

      switch (currentDrag.type) {
        case 'chat': {
          const updatedConversations = reorderItem(
            conversations,
            currentDrag.id,
            source.index,
            destination.index,
            folder?.id,
          );

          dispatch({ field: 'conversations', value: updatedConversations });
          saveConversations(updatedConversations);
          updateConversationLastUpdatedAtTimeStamp();
          break;
        }
        case 'prompt': {
          const updatedPrompts = reorderItem(
            prompts,
            currentDrag.id,
            source.index,
            destination.index,
            folder?.id,
          );

          dispatch({ field: 'prompts', value: updatedPrompts });
          savePrompts(updatedPrompts);
          updateConversationLastUpdatedAtTimeStamp();
          break;
        }
        case 'chat-folder':
        case 'prompt-folder': {
          const updatedFolders = reorderFolder(
            folders,
            currentDrag.id,
            source.index,
            destination.index,
          );

          dispatch({ field: 'folders', value: updatedFolders });
          saveFolders(updatedFolders);
        }
      }

      removeDragData();
    },
    [conversations, prompts, folders, currentDrag, removeDragData, dispatch],
  );

  return (
    <Component onDragStart={onDragStart} onDragEnd={onDragEnd}>
      {children}
    </Component>
  );
};
