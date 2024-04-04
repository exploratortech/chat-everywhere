import React from 'react';

import { ShareMessagesByTeacherProfilePayload } from '@/types/share-messages-by-teacher-profile';

import SharedMessageItem from './SharedMessageItem';

interface SharedMessageListProps {
  sharedMessages: ShareMessagesByTeacherProfilePayload['submissions'] | null;
  handleSelectMessage: (id: number) => void;
  selectedMessageIds: number[];
}

const SharedMessageList: React.FC<SharedMessageListProps> = ({
  sharedMessages,
  handleSelectMessage,
  selectedMessageIds,
}) => {
  return (
    <div className="flex flex-wrap gap-4">
      {sharedMessages?.map((submission) => (
        <SharedMessageItem
          key={submission.id}
          submission={submission}
          onSelectMessage={handleSelectMessage}
          isSelected={selectedMessageIds.includes(submission.id)}
        />
      ))}
    </div>
  );
};

export default SharedMessageList;
