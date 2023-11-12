import { useEffect } from 'react';

import { type MessageType } from '@/types/v2Chat/chat';

import { ChatMessage } from '@/components/v2Chat/chat-message';
import { ImageGenerationSpinner } from '@/components/v2Chat/image-generation-spinner';
import { Separator } from '@/components/v2Chat/ui/separator';

export interface ChatList {
  messages: MessageType[];
  scrollToButton: () => void;
}

export function ChatList({ messages, scrollToButton }: ChatList) {
  useEffect(() => {
    scrollToButton();
  }, [messages]);

  if (!messages.length) {
    return null;
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4 h-full">
      {messages.map((message, index) => (
        <div key={index}>
          <ChatMessage message={message} />
          {index < messages.length - 1 && (
            <Separator className="my-4 md:my-8" />
          )}
          {message.metadata?.imageGenerationStatus === 'in progress' && (
            <ImageGenerationSpinner />
          )}
        </div>
      ))}
    </div>
  );
}
