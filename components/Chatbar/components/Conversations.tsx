import { useContext } from 'react';

import { Conversation } from '@/types/chat';

import HomeContext from '@/components/home/home.context';

import { ConversationComponent } from './Conversation';

import { cn } from '@/lib/utils';
import { Droppable } from '@hello-pangea/dnd';

interface Props {
  conversations: Conversation[];
}

export const Conversations = ({ conversations }: Props) => {
  const {
    state: { currentDrag },
  } = useContext(HomeContext);

  return (
    <Droppable
      droppableId="conversations-droppable"
      isDropDisabled={currentDrag && currentDrag.type !== 'chat'}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          className={cn(
            'flex w-full flex-col rounded-lg min-h-[10px]',
            snapshot.isDraggingOver &&
              'bg-[#343541] border-2 border-indigo-400 rounded-lg',
          )}
          {...provided.droppableProps}
        >
          {conversations.map((conversation, index) => (
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
