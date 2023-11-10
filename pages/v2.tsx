'use client';

/* This is our initial effort to revamp the UI and underlying structure for the app.
 * UI components are heavily inspired by vercel/ai-chatbot's repo https://github.com/vercel-labs/ai-chatbot
 *
 * We will opt to use Assistant API in v2 with raw endpoints instead of the SDK, until Vercel's AI package is ready.
 *  https://github.com/vercel/ai/pull/728
 */
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import React, { useEffect, useState } from 'react';

import { appWithTranslation } from 'next-i18next';

import { userProfileQuery } from '@/utils/server/supabase';

import { UserProfile } from '@/types/user';
import type { ConversationType, MessageType } from '@/types/v2Chat/chat';

import { ChatPanel } from '@/components/v2Chat/chat-panel';
import { Header } from '@/components/v2Chat/header';
import { TooltipProvider } from '@/components/v2Chat/ui/tooltip';

const V2Chat = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>();
  const [selectedConversationId, setSelectedConversationId] =
    useState<string>('');
  const [latestMessageId, setLatestMessageId] = useState<string | null>(null);
  const [chatRespondLoading, setChatRespondLoading] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');

  const [conversations, setConversations] = useState<ConversationType[]>([]);

  const onMessageSent = async (message: string) => {};

  const supabase = useSupabaseClient();
  const user = useUser();

  useEffect(() => {
    if (user && !userProfile) {
      userProfileQuery({
        client: supabase,
        userId: user.id,
      }).then((res) => {
        setUserProfile(res);
      });
    }
  }, [user]);

  if (!userProfile) {
    return (
      <div>
        <h1>Access Denied</h1>
        <p>You must be logged in to view this page.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Header userProfile={userProfile} />
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
  );
};

export default appWithTranslation(V2Chat);
