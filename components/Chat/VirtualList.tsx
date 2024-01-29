import { IconArrowDown } from '@tabler/icons-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { useAutoScroll } from '@/hooks/useAutoScroll';

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
  const virtuoso = useRef<VirtuosoHandle>(null);

  const [showScrollDownButton, setShowScrollDownButton] =
    useState<boolean>(false);

  const handleScrollDown = useCallback(() => {
    console.log('scrolling down');
    virtuoso.current?.scrollToIndex({
      index: messages.length - 1,
      behavior: 'smooth',
      align: 'end',
    });
  }, [messages.length]);

  const [atBottom, setAtBottom] = useState<boolean>(false);

  // Inside your VirtualList component
  useAutoScroll(messageIsStreaming && atBottom, handleScrollDown, 200);

  useEffect(() => {
    setShowScrollDownButton(!atBottom);
  }, [atBottom]);

  return (
    <>
      <Virtuoso
        ref={virtuoso}
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
        atTopThreshold={300}
        overscan={500}
        initialTopMostItemIndex={messages.length - 1}
        atBottomThreshold={100}
        atBottomStateChange={(atBottom) => {
          console.log({ atBottom });
          setAtBottom(atBottom);
        }}
      />
      {showScrollDownButton && (
        <div className="z-10 absolute bottom-0 right-0 mb-4 mr-4 pb-20">
          <button
            className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-gray-700 shadow-md hover:shadow-lg dark:bg-gray-700 dark:text-gray-200"
            onClick={handleScrollDown}
          >
            <IconArrowDown size={18} />
          </button>
        </div>
      )}
    </>
  );
};

export default VirtualList;
