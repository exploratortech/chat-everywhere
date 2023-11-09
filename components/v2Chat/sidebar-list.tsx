import { type ConversationType } from '@/types/v2Chat/chat';

import { SidebarItem } from '@/components/v2Chat/sidebar-item';

export interface SidebarListProps {
  userId?: string;
}

export function SidebarList({ userId }: SidebarListProps) {
  const chats: ConversationType[] = [];

  return (
    <div className="flex-1 overflow-auto">
      {chats?.length ? (
        <div className="space-y-2 px-2">
          {chats.map(
            (chat) =>
              chat && (
                <SidebarItem
                  key={chat?.id}
                  conversation={chat}
                  selected={false}
                />
              ),
          )}
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No chat history</p>
        </div>
      )}
    </div>
  );
}
