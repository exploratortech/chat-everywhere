import React from 'react';

import { type ConversationType } from '@/types/v2Chat/chat';

import { SidebarItem } from '@/components/v2Chat/sidebar-item';

export interface SidebarListProps {
  conversations: ConversationType[];
  conversationOnSelect: (conversationId: string) => void;
  selectedConversationId: string;
}

export function SidebarList({
  conversations,
  conversationOnSelect,
  selectedConversationId,
}: SidebarListProps) {
  return (
    <div className="flex-1 overflow-auto">
      {conversations?.length ? (
        <div className="space-y-2 px-2">
          {conversations.map(
            (conversation) =>
              conversation && (
                <SidebarItem
                  key={conversation?.id}
                  conversation={conversation}
                  selected={selectedConversationId === conversation.id}
                  conversationOnSelect={conversationOnSelect}
                />
              ),
          )}
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No conversation history
          </p>
        </div>
      )}
    </div>
  );
}
