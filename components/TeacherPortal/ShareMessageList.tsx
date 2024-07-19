import React, { forwardRef } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';

import type { ShareMessagesByTeacherProfilePayload } from '@/types/share-messages-by-teacher-profile';

import SharedMessageItem from './SharedMessageItem';

import { cn } from '@/lib/utils';

interface SharedMessageListProps {
  sharedMessages: ShareMessagesByTeacherProfilePayload['submissions'] | null;
  handleSelectMessage: (id: number, isShiftKey?: boolean) => void;
  selectedMessageIds: number[];
}

const SharedMessageList: React.FC<SharedMessageListProps> = ({
  sharedMessages,
  handleSelectMessage,
  selectedMessageIds,
}) => {
  return (
    <VirtuosoGrid
      totalCount={sharedMessages ? sharedMessages.length : 0}
      components={gridComponents}
      itemContent={(index) => {
        const submission = sharedMessages ? sharedMessages[index] : null;
        if (!submission) return null; // Or some placeholder component

        return (
          <SharedMessageItem
            className="w-full"
            key={submission.id}
            submission={submission}
            onSelectMessage={handleSelectMessage}
            isSelected={selectedMessageIds.includes(submission.id)}
          />
        );
      }}
    />
  );
};

export default SharedMessageList;

const gridComponents = {
  // eslint-disable-next-line react/display-name
  List: forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ style, children, className, ...props }, ref) => (
      <div
        ref={ref}
        {...props}
        className={cn(className, 'flex flex-wrap gap-4')}
        style={style}
      >
        {children}
      </div>
    ),
  ),
  Item: ({
    children,
    ...props
  }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
    <div
      {...props}
      className="box-border flex w-[300px] flex-none content-stretch mobile:w-full"
    >
      {children}
    </div>
  ),
};
