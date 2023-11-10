import { useSupabaseClient } from '@supabase/auth-helpers-react';
import React, { useEffect, useState } from 'react';

import { type ConversationType } from '@/types/v2Chat/chat';

import { SidebarItem } from '@/components/v2Chat/sidebar-item';

export interface SidebarListProps {
  userId: string;
}

export function SidebarList({ userId }: SidebarListProps) {
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const supabaseClient = useSupabaseClient();

  useEffect(() => {

    fetchConversations();
  }, [userId]);

  const fetchConversations = async () => {
    console.log("fetching conversations");
    
    const { data, error } = await supabaseClient
      .from('user_v2_conversations')
      .select('*')
      .eq('uid', userId);

    if (error) {
      console.log(error);
    } else {
      console.log(data);

      // setConversations(data);
    }
  };

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
                  selected={false}
                />
              ),
          )}
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No conversation history</p>
        </div>
      )}
    </div>
  );
}
