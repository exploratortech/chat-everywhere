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
  const [input, setInput] = useState<string>('');

  const [selectedConversationId, setSelectedConversationId] =
    useState<string>('');
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [chatRespondLoading, setChatRespondLoading] = useState<boolean>(false);

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

      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (!selectedConversationId) return;

    const conversation = conversations.find(
      (item) => item.id === selectedConversationId,
    );

    if (!conversation) return;
    fetchMessages(conversation.threadId);
  }, [selectedConversationId]);

  const fetchConversations = async () => {
    if (user === null) return;

    const { data, error } = await supabase
      .from('user_v2_conversations')
      .select('*')
      .eq('uid', user.id);

    if (error) {
      console.log(error);
    } else {
      const conversations: ConversationType[] = data.map((item: any) => ({
        id: item.id,
        threadId: item.threadId,
        messages: [],
        loading: false,
        title: item.title,
      }));
      setConversations(conversations);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (!user) return;

    const response = await fetch('/api/v2/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-id': user.id,
      },
      body: JSON.stringify({ conversationId }),
    });
    const data = await response.json();
    console.log(data);
  };

  const conversationOnSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

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
      <div className="flex flex-col min-h-screen">
        <Header
          userProfile={userProfile}
          conversationOnSelect={conversationOnSelect}
          selectedConversationId={selectedConversationId}
          conversations={conversations}
        />
        <main className="flex flex-col flex-1 bg-muted/50">
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
        </main>
      </div>
    </TooltipProvider>
  );
};

export default appWithTranslation(V2Chat);
