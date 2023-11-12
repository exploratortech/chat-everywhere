'use client';

/* This is our initial effort to revamp the UI and underlying structure for the app.
 * UI components are heavily inspired by vercel/ai-chatbot's repo https://github.com/vercel-labs/ai-chatbot
 *
 * We will opt to use Assistant API in v2 with raw endpoints instead of the SDK, until Vercel's AI package is ready.
 *  https://github.com/vercel/ai/pull/728
 */
import {
  useSession,
  useSupabaseClient,
  useUser,
} from '@supabase/auth-helpers-react';
import React, { useEffect, useRef, useState } from 'react';

import { appWithTranslation } from 'next-i18next';

import { userProfileQuery } from '@/utils/server/supabase';

import { UserProfile } from '@/types/user';
import type {
  ConversationType,
  MessageType,
  OpenAIMessageType,
} from '@/types/v2Chat/chat';

import { ChatList } from '@/components/v2Chat/chat-list';
import { ChatPanel } from '@/components/v2Chat/chat-panel';
import { ChatScrollAnchor } from '@/components/v2Chat/chat-scroll-anchor';
import { EmptyScreen } from '@/components/v2Chat/empty-screen';
import { Header } from '@/components/v2Chat/header';
import { TooltipProvider } from '@/components/v2Chat/ui/tooltip';

const V2Chat = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>();
  const [input, setInput] = useState<string>('');
  const chatScrollAnchorRef = useRef();
  const [enablePullingForUpdates, setEnablePullingForUpdates] = useState(false);

  const [selectedConversationId, setSelectedConversationId] =
    useState<string>('');
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationType | null>(null);
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [chatResponseLoading, setChatResponseLoading] =
    useState<boolean>(false);

  const supabase = useSupabaseClient();
  const user = useUser();
  const session = useSession();

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
    if (!selectedConversationId) {
      setSelectedConversation(null);
      setMessages([]);
      return;
    }

    const conversation = conversations.find(
      (item) => item.id === selectedConversationId,
    );

    if (!conversation) return;
    setSelectedConversation(conversation);
    fetchMessages(conversation.threadId);
  }, [selectedConversationId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (enablePullingForUpdates && selectedConversation) {
        fetchMessages(selectedConversation.threadId);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [enablePullingForUpdates, selectedConversation]);

  const scrollToButton = () => {
    if(!chatScrollAnchorRef.current) return;
    interface ChatScrollAnchorMethods {
      scrollToBottom: () => void;
    }
    (chatScrollAnchorRef.current as ChatScrollAnchorMethods).scrollToBottom();
  }

  const fetchConversations = async () => {
    if (user === null) return;

    const { data, error } = await supabase
      .from('user_v2_conversations')
      .select('*')
      .eq('uid', user.id)
      .order('created_at', { ascending: false });

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
      if (conversations.length > 0) {
        setSelectedConversationId(conversations[0].id);
      }
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (!user || !session) return;

    const response = await fetch('/api/v2/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-token': session.access_token,
      },
      body: JSON.stringify({
        requestType: 'retrieve messages',
        conversationId,
      }),
    });
    const data = (await response.json()) as OpenAIMessageType[];
    const messages: MessageType[] = data.map((messageItem) => ({
      role: messageItem.role,
      content: messageItem.content[0].text.value,
      metadata: messageItem.metadata,
    }));
    setMessages(messages);

    // Check if requires pulling
    const lastMessage = messages[messages.length - 1];
    if(!lastMessage || !lastMessage.metadata) return;
    if(lastMessage.metadata.imageGenerationStatus === "in progress"){
      setChatResponseLoading(true);
      setEnablePullingForUpdates(true);
    }else{
      setChatResponseLoading(false);
      setEnablePullingForUpdates(false);
    }
  };

  const onMessageSent = async (message: any) => {
    if (!user || !session) return;

    setChatResponseLoading(true);

    let tempSelectedConversation: ConversationType;

    if (!selectedConversation) {
      const response = await fetch('/api/v2/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-token': session.access_token,
        },
        body: JSON.stringify({
          requestType: 'create conversation',
          messageContent: message.content,
        }),
      });

      if (!response.ok) {
        console.error(await response.text());
        return;
      }

      const data = await response.json();
      tempSelectedConversation = { ...data };
      setConversations([tempSelectedConversation, ...conversations]);
      setSelectedConversationId(tempSelectedConversation.id);
      setSelectedConversation(tempSelectedConversation);
    } else {
      tempSelectedConversation = selectedConversation;
      setMessages([
        ...messages,
        {
          role: 'user',
          content: message.content,
        },
      ]);
    }

    const response = await fetch('/api/v2/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-token': session.access_token,
      },
      body: JSON.stringify({
        requestType: 'send message',
        conversationId: tempSelectedConversation.threadId,
        messageContent: input,
      }),
    });

    if (response.status === 200) {
      setChatResponseLoading(false);
    } else {
      console.error(response);
    }

    setChatResponseLoading(false);
    fetchMessages(tempSelectedConversation.threadId);
  };

  const startNewChat = () => {
    setSelectedConversationId('');
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
      <div className="v2-container flex flex-col min-h-screen">
        <Header
          userProfile={userProfile}
          startNewChat={startNewChat}
          conversationOnSelect={conversationOnSelect}
          selectedConversationId={selectedConversationId}
          conversations={conversations}
        />
        <main className="group w-full max-h-screen pl-0 animate-in duration-300 ease-in-out overflow-y-auto">
          <div className="pb-[200px] pt-4 md:pt-10">
            {messages.length > 0 ? (
              <>
                <ChatList
                  messages={messages}
                  scrollToButton={scrollToButton}
                />
                <ChatScrollAnchor
                  ref={chatScrollAnchorRef}
                  trackVisibility={chatResponseLoading}
                />
              </>
            ) : (
              <EmptyScreen />
            )}
          </div>
          <ChatPanel
            id={selectedConversationId}
            isLoading={chatResponseLoading}
            stop={() => {}}
            append={onMessageSent}
            reload={() => {}}
            input={input}
            setInput={setInput}
            messages={conversations}
            startNewChat={startNewChat}
          />
        </main>
      </div>
    </TooltipProvider>
  );
};

export default appWithTranslation(V2Chat);
