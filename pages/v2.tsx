'use client'
import React, { useState } from 'react';

import { ChatPanel } from '@/components/v2Chat/chat-panel';
import { TooltipProvider } from '@/components/v2Chat/ui/tooltip'

const V2Chat = () => {
  const [threadId, setThreadId] = useState<string>('');
  const [latestMessageId, setLatestMessageId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');

  const [messages, setMessages] = useState<any[]>([]);

  const onMessageSent = async (message: string) => {};

  return (
    <TooltipProvider>
      <ChatPanel
        id={threadId}
        isLoading={loading}
        stop={() => {}}
        append={onMessageSent}
        reload={() => {}}
        input={input}
        setInput={setInput}
        messages={messages}
      />
    </TooltipProvider>
  );
};

export default V2Chat;
