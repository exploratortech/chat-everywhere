import { Conversation } from '@/types/chat';

import { ConversationComponent } from './Conversation';

interface Props {
  conversations: Conversation[];
}

export const Conversations = ({ conversations }: Props) => {
  return (
    <div className="flex w-full gap-1 flex-col-reverse rounded-lg">
      {conversations
        .filter((conversation) => !conversation.folderId)
        .map((conversation) => (
          <ConversationComponent
            key={conversation.id}
            conversation={conversation}
          />
        ))}
    </div>
  );
};
