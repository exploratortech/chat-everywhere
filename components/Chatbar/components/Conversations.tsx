import { Fragment, useContext } from 'react';

import HomeContext from '@/components/home/home.context';

import { Conversation } from '@/types/chat';

import { generateRank, reorderItem } from '@/utils/app/rank';

import { ConversationComponent } from './Conversation';
import DropArea from '@/components/DropArea/DropArea';
import { saveConversations, updateConversationLastUpdatedAtTimeStamp } from '@/utils/app/conversation';

interface Props {
  conversations: Conversation[];
}

export const Conversations = ({ conversations }: Props) => {
  const {
    state: {
      currentDrag,
      conversations: unfilteredConversations,
    },
    dispatch,
  } = useContext(HomeContext);

  const handleCanDrop = (): boolean => {
    return !!currentDrag && currentDrag.type === 'conversation';
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>, index: number): void => {
    if (currentDrag) {
      const conversation = currentDrag.data as Conversation;
      const reorderedConversations = reorderItem(
        unfilteredConversations,
        conversation.id,
        generateRank(
          unfilteredConversations.filter((c) => c.folderId == null),
          index,
        ),
        { updates: { folderId: null } },
      )
      dispatch({ field: 'conversations', value: reorderedConversations });
      saveConversations(reorderedConversations);
      updateConversationLastUpdatedAtTimeStamp();
    }
    e.stopPropagation();
  };

  return (
    <div className="flex w-full flex-col rounded-lg">
      <DropArea
        allowedDragTypes={['conversation']}
        canDrop={handleCanDrop}
        index={0}
        onDrop={(e) => handleDrop(e, 0)}
      />
      {conversations.map((conversation, index) => (
          <Fragment key={conversation.id}>
            <ConversationComponent conversation={conversation} />
            <DropArea
              allowedDragTypes={['conversation']}
              canDrop={handleCanDrop}
              index={index + 1}
              onDrop={(e) => handleDrop(e, index + 1)}
            />
          </Fragment>
        ))}
    </div>
  );
};
