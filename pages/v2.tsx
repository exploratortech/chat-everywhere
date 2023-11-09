/* This is our initial effort to revamp the UI and underlying structure for the app.
 * UI components are heavily inspired by vercel/ai-chatbot's repo https://github.com/vercel-labs/ai-chatbot
 *
 * We will opt to use Assistant API in v2 with raw endpoints instead of the SDK, until Vercel's AI package is ready.
 *  https://github.com/vercel/ai/pull/728
 */
'use client';

import { Session, SessionContextProvider } from '@supabase/auth-helpers-react';
import React, { useState } from 'react';

import { appWithTranslation } from 'next-i18next';

import type { ConversationType, MessageType } from '@/types/v2Chat/chat';

import { ChatPanel } from '@/components/v2Chat/chat-panel';
import { Header } from '@/components/v2Chat/header';
import { TooltipProvider } from '@/components/v2Chat/ui/tooltip';

import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';

const V2Chat = () => {
  const [selectedConversationId, setSelectedConversationId] =
    useState<string>('');
  const [latestMessageId, setLatestMessageId] = useState<string | null>(null);
  const [chatRespondLoading, setChatRespondLoading] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');

  const [conversations, setConversations] = useState<ConversationType[]>([]);

  const onMessageSent = async (message: string) => {};

  const [supabase] = useState(() => createBrowserSupabaseClient());

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <TooltipProvider>
        <Header/>
        <ChatPanel
          id={selectedConversationId}
          isLoading={chatRespondLoading}
          stop={() => {}}
          append={onMessageSent}
          reload={() => {}}
          input={input}
          setInput={setInput}
          messages={conversations}
        />
      </TooltipProvider>
    </SessionContextProvider>
  );
};

export default appWithTranslation(V2Chat);
