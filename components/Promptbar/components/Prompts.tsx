import type { FC } from 'react';
import { useContext } from 'react';

import type { Prompt } from '@/types/prompt';

import HomeContext from '@/components/home/home.context';

import { PromptComponent } from './Prompt';

import { cn } from '@/lib/utils';
import { Droppable } from '@hello-pangea/dnd';

interface Props {
  prompts: Prompt[];
}

export const Prompts: FC<Props> = ({ prompts }) => {
  const {
    state: { currentDrag },
  } = useContext(HomeContext);

  return (
    <Droppable
      droppableId="prompts-droppable"
      isDropDisabled={currentDrag && currentDrag.type !== 'prompt'}
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
          {prompts.map((prompt, index) => (
            <PromptComponent
              key={prompt.id}
              prompt={prompt}
              draggableIndex={index}
            />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};
