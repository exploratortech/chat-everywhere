import { Virtuoso } from 'react-virtuoso';

import { Message } from '@/types/chat';

import { ChatMessage } from './ChatMessage';

const VirtualList = ({
  messages,
  messageIsStreaming,
  onEdit,
}: {
  messages: Message[];
  messageIsStreaming: any;
  onEdit: any;
}) => {
  return (
    <Virtuoso
      style={{
        height: '100%',
        overflowX: 'hidden',
      }}
      data={messages}
      itemContent={(index, message) => {
        return (
          <div
            style={{
              paddingBottom: index === messages.length - 1 ? '128px' : '0',
            }}
          >
            <ChatMessage
              message={message}
              messageIndex={index}
              onEdit={onEdit}
              messageIsStreaming={messageIsStreaming}
            />
          </div>
        );
      }}
      followOutput={'smooth'}
      atTopThreshold={300}
      overscan={500}
      initialTopMostItemIndex={messages.length - 1}
    />
  );
};

export default VirtualList;
