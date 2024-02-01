import { IconArrowDown } from '@tabler/icons-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { throttle } from '@/utils/data/throttle';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showScrollDownButton, setShowScrollDownButton] =
    useState<boolean>(false);

  // BUTTON TO SCROLL DOWN
  const handleScrollDown = () => {
    virtuoso.current?.scrollToIndex({
      index: messages.length - 1,
      behavior: 'smooth',
      align: 'end',
    });
  };
  // SCROLL DOWN ON NEW MESSAGE
  const scrollDown = () => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView(true);
    }
  };

  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(false);

  const handleScroll = throttle((scrollEvent) => {
    const { scrollTop, scrollHeight, clientHeight } = scrollEvent.target;

    const bottomTolerance = 30;

    if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
      setAutoScrollEnabled(false);
      setShowScrollDownButton(true);
    } else {
      setAutoScrollEnabled(true);
      setShowScrollDownButton(false);
    }
  }, 100);
  const throttledScrollDown = throttle(scrollDown, 250);

  useEffect(() => {
    throttledScrollDown();
  }, [messages, throttledScrollDown]);

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
        onScroll={handleScroll}
        atTopThreshold={300}
        overscan={500}
        initialTopMostItemIndex={messages.length - 1}
        components={{
          Footer: () => {
            return <div ref={messagesEndRef} className="h-10"></div>;
          },
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
