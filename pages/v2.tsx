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
import toast from 'react-hot-toast';

import { appWithTranslation } from 'next-i18next';

import { userProfileQuery } from '@/utils/server/supabase';

import { UserProfile } from '@/types/user';
import type {
  ConversationType,
  MessageType,
  RetrieveMessageResponseType,
} from '@/types/v2Chat/chat';

import { ChatList } from '@/components/v2Chat/chat-list';
import { ChatPanel } from '@/components/v2Chat/chat-panel';
import { ChatScrollAnchor } from '@/components/v2Chat/chat-scroll-anchor';
import { EmptyScreen } from '@/components/v2Chat/empty-screen';
import { Header } from '@/components/v2Chat/header';
import { InitialScreen } from '@/components/v2Chat/initial-screen';
import { PaymentDialog } from '@/components/v2Chat/payment-dialog';
import { ConversationLoadingSpinner } from '@/components/v2Chat/ui/conversation-loading-spinner';
import { TooltipProvider } from '@/components/v2Chat/ui/tooltip';

const V2Chat = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>();
  const [input, setInput] = useState<string>('');
  const chatScrollAnchorRef = useRef();
  const [enablePullingForUpdates, setEnablePullingForUpdates] = useState(false);

  const [openPaymentDialog, setOpenPaymentDialog] = useState<boolean>(false);
  const [selectedConversationId, setSelectedConversationId] =
    useState<string>('');
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationType | null>(null);
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [allMessagesAreLoaded, setAllMessagesAreLoaded] =
    useState<boolean>(false);
  const [chatMessagesLoading, setChatMessagesLoading] =
    useState<boolean>(false);
  const [chatResponseLoading, setChatResponseLoading] =
    useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

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
    setChatMessagesLoading(true);
    setSelectedConversation(conversation);
    fetchMessages(conversation.threadId);
  }, [selectedConversationId]);

  useEffect(() => {
    const triggerFetchMessages = () => {
      if (enablePullingForUpdates && selectedConversation) {
        fetchMessages(selectedConversation.threadId);
      }
    };

    triggerFetchMessages();

    const interval = setInterval(() => {
      triggerFetchMessages();
    }, 2000);

    return () => clearInterval(interval);
  }, [enablePullingForUpdates, selectedConversation]);

  useEffect(() => {
    fetchSuggestions();
  }, [messages]);

  const scrollToButton = () => {
    if (!chatScrollAnchorRef.current) return;
    interface ChatScrollAnchorMethods {
      scrollToBottom: () => void;
    }
    (chatScrollAnchorRef.current as ChatScrollAnchorMethods).scrollToBottom();
  };

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

    if (!response.ok) {
      console.error(response);
      toast.error('Unable to load messages. Please try again later.');
      setChatMessagesLoading(false);
      setChatResponseLoading(false);
      setEnablePullingForUpdates(false);
      return;
    }

    const data = (await response.json()) as RetrieveMessageResponseType;
    const messages: MessageType[] = data.messages.map((messageItem) => ({
      id: messageItem.id,
      role: messageItem.role,
      content: messageItem.content[0].text.value,
      metadata: messageItem.metadata,
    }));
    setMessages(messages);
    setAllMessagesAreLoaded(false);

    // Check if requires polling on conversation status
    if (data.requiresPolling) {
      setChatResponseLoading(true);
      setEnablePullingForUpdates(true);
    } else {
      setChatMessagesLoading(false);
      setChatResponseLoading(false);
      setEnablePullingForUpdates(false);
    }
  };

  const fetchMoreMessages = async (latestMessageId: string) => {
    if (!user || !session || !latestMessageId) return;

    const response = await fetch('/api/v2/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-token': session.access_token,
      },
      body: JSON.stringify({
        requestType: 'retrieve messages',
        conversationId: selectedConversation?.threadId || '',
        latestMessageId,
      }),
    });

    if (!response.ok) {
      console.error(response);
      toast.error('Unable to load messages. Please try again later.');
      return;
    }

    const data = (await response.json()) as RetrieveMessageResponseType;
    const newMessages: MessageType[] = data.messages.map((messageItem) => ({
      id: messageItem.id,
      role: messageItem.role,
      content: messageItem.content[0].text.value,
      metadata: messageItem.metadata,
    }));

    if (newMessages.length !== 0) {
      setMessages([...messages, ...newMessages]);
      return;
    } else {
      setAllMessagesAreLoaded(true);
      return;
    }
  };

  const fetchSuggestions = async () => {
    if (!user || !session || enablePullingForUpdates || chatResponseLoading)
      return;

    if (messages.length === 0 || messages[0].role !== 'assistant') return;

    const response = await fetch('/api/v2/suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-token': session.access_token,
      },
      body: JSON.stringify({
        previousMessages: messages.slice(Math.max(messages.length - 4, 0)),
        latestAssistantMessage: messages[messages.length - 1],
      }),
    });

    try {
      const suggestions = await response.json();
      if (
        !Array.isArray(suggestions) ||
        !suggestions.every((item) => typeof item === 'string')
      ) {
        throw new Error(
          `Invalid suggestions format. Expected an array of strings. Got ${suggestions}`,
        );
      }
      setSuggestions(suggestions);
      console.log('Received suggestions: ', suggestions);

      setTimeout(() => {
        scrollToButton();
      }, 500);
    } catch (error) {
      setSuggestions([]);
      console.error(error);
    }
  };

  const onMessageSent = async (message: MessageType) => {
    if (!user || !session) return;

    setChatResponseLoading(true);
    setSuggestions([]);

    let tempSelectedConversation: ConversationType;

    if (!selectedConversation) {
      setChatMessagesLoading(true);
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
        toast.error('Unable to send message. Please try again later.');
        return;
      }

      const data = await response.json();
      tempSelectedConversation = { ...data };
      setConversations([tempSelectedConversation, ...conversations]);
      setSelectedConversationId(tempSelectedConversation.id);
    } else {
      tempSelectedConversation = selectedConversation;
      setMessages([
        ...messages,
        {
          id: 'temp-id',
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
        messageContent: input || message.content,
      }),
    });

    if (response.status !== 200) {
      toast.error('Unable to send message. Please try again later.');
      console.error(response);
      return;
    }

    setChatResponseLoading(true);
    setEnablePullingForUpdates(true);
  };

  const startNewChat = () => {
    setSelectedConversationId('');
  };

  const conversationOnSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  if (!userProfile) {
    return <InitialScreen />;
  }

  return (
    <TooltipProvider>
      <div className="v2-container flex flex-col min-h-screen w-screen">
        <PaymentDialog
          userProfile={userProfile}
          open={userProfile.plan === 'free' || openPaymentDialog}
          onOpenChange={(open: boolean) => setOpenPaymentDialog(open)}
        />
        <Header
          userProfile={userProfile}
          startNewChat={startNewChat}
          conversationOnSelect={conversationOnSelect}
          selectedConversationId={selectedConversationId}
          conversations={conversations}
          profileOnClick={() => setOpenPaymentDialog(true)}
        />
        <main className="group w-full max-h-screen pl-0 animate-in duration-300 ease-in-out overflow-y-auto">
          <div
            className={`flex justify-center ${
              messages.length === 0 ? 'h-screen' : ''
            }`}
          >
            {chatMessagesLoading && <ConversationLoadingSpinner />}
            {messages.length > 0 ? (
              <div>
                <ChatList
                  messages={messages}
                  scrollToButton={scrollToButton}
                  suggestions={suggestions}
                  onMessageSent={onMessageSent}
                  isChatResponseLoading={chatResponseLoading}
                  chatMessagesLoading={chatMessagesLoading}
                  onLoadMore={fetchMoreMessages}
                  allMessagesAreLoaded={allMessagesAreLoaded}
                />
                <ChatScrollAnchor
                  ref={chatScrollAnchorRef}
                  trackVisibility={chatResponseLoading}
                />
              </div>
            ) : (
              !chatMessagesLoading && <EmptyScreen />
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
