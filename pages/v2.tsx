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
      role: messageItem.role,
      content: messageItem.content[0].text.value,
      metadata: messageItem.metadata,
    }));
    setMessages(messages);

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

  const fetchSuggestions = async () => {
    if (!user || !session || enablePullingForUpdates || chatResponseLoading)
      return;

    if (
      messages.length === 0 ||
      messages[messages.length - 1].role !== 'assistant'
    )
      return;

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
    return (
      <InitialScreen />
    );
  }

  return (
    <TooltipProvider>
      <div className="v2-container flex flex-col min-h-screen w-screen">
        <Header
          userProfile={userProfile}
          startNewChat={startNewChat}
          conversationOnSelect={conversationOnSelect}
          selectedConversationId={selectedConversationId}
          conversations={conversations}
        />
        <main className="group w-full max-h-screen pl-0 animate-in duration-300 ease-in-out overflow-y-auto pt-5">
          <div className="pb-[120px] mt-12 mb-14">
            {chatMessagesLoading && <ConversationLoadingSpinner />}
            {messages.length > 0 ? (
              <>
                <ChatList
                  messages={messages}
                  scrollToButton={scrollToButton}
                  suggestions={suggestions}
                  onMessageSent={onMessageSent}
                  isChatResponseLoading={chatResponseLoading}
                  chatMessagesLoading={chatMessagesLoading}
                />
                <ChatScrollAnchor
                  ref={chatScrollAnchorRef}
                  trackVisibility={chatResponseLoading}
                />
              </>
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

const ConversationLoadingSpinner = () => (
  <div className="relative mx-auto max-w-2xl px-4 h-full">
    <div className="flex justify-center items-center h-full mt-5">
      <svg
        aria-hidden="true"
        className="w-10 h-10 me-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600 mr-2"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
    </div>
  </div>
);

export default appWithTranslation(V2Chat);
