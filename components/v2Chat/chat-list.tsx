import InfiniteScroll from 'react-infinite-scroll-component';

import { type MessageType } from '@/types/v2Chat/chat';

import { ChatMessage } from '@/components/v2Chat/chat-message';
import { ImageContainer } from '@/components/v2Chat/image-container';
import { ImageGenerationSpinner } from '@/components/v2Chat/image-generation-spinner';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/v2Chat/ui/alert';
import { ConversationLoadingSpinner } from '@/components/v2Chat/ui/conversation-loading-spinner';
import { Separator } from '@/components/v2Chat/ui/separator';
import { SuggestionContainer } from '@/components/v2Chat/ui/suggestion-container';

export interface ChatList {
  messages: MessageType[];
  scrollToButton: () => void;
  suggestions: string[];
  onMessageSent: (message: MessageType) => void;
  isChatResponseLoading: boolean;
  chatMessagesLoading: boolean;
  onLoadMore: (firstMessageId: string) => void;
  allMessagesAreLoaded: boolean;
}

export function ChatList({
  messages,
  scrollToButton,
  suggestions,
  onMessageSent,
  isChatResponseLoading,
  chatMessagesLoading,
  onLoadMore,
  allMessagesAreLoaded,
}: ChatList) {
  if (!messages.length) {
    return null;
  }

  if (chatMessagesLoading) {
    return <></>;
  }

  return (
    <div
      className="relative max-w-3xl overflow-auto flex flex-col-reverse h-[calc(99vh-4rem)] pb-[6rem] justify-start"
      id="scrollableDiv"
    >
      <InfiniteScroll
        dataLength={messages.length}
        next={() => onLoadMore(messages[messages.length - 1].id || '')}
        style={{ display: 'flex', flexDirection: 'column-reverse' }}
        inverse={true}
        hasMore={!allMessagesAreLoaded}
        loader={<ConversationLoadingSpinner className="mb-3" />}
        scrollableTarget="scrollableDiv"
        scrollThreshold={0.6}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`h-full w-full ${
              index === messages.length - 1 ? 'mt-10' : ''
            }`}
          >
            <ChatMessage message={message} />
            {index !== 0 && <Separator className="my-4 md:my-8" />}
            {message.metadata?.imageGenerationStatus === 'in progress' && (
              <ImageGenerationSpinner />
            )}
            {message.metadata?.imageGenerationStatus === 'completed' &&
              message.metadata?.imageUrl && (
                <ImageContainer url={message.metadata.imageUrl} />
              )}
            {message.metadata?.imageGenerationStatus === 'failed' && (
              <Alert variant="destructive" className="max-w-xs mb-6">
                <AlertTitle>Error!</AlertTitle>
                <AlertDescription>
                  Unable to generate image, please try again
                </AlertDescription>
              </Alert>
            )}
            {index === 0 && (
              <SuggestionContainer
                suggestions={suggestions}
                isChatResponseLoading={isChatResponseLoading}
                onMessageSent={onMessageSent}
              />
            )}
          </div>
        ))}
      </InfiniteScroll>
    </div>
  );
}
