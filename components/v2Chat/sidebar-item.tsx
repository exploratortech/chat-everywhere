'use client';

import { cn } from '@/utils/v2Chat/utils';

import { type ConversationType } from '@/types/v2Chat/chat';

import { buttonVariants } from '@/components/v2Chat/ui/button';
import { IconMessage } from '@/components/v2Chat/ui/icons';

interface SidebarItemProps {
  conversation: ConversationType;
  selected: boolean;
  conversationOnSelect: (conversationId: string) => void;
}

export function SidebarItem({
  conversation,
  selected,
  conversationOnSelect,
}: SidebarItemProps) {
  if (!conversation?.id) return null;

  return (
    <div
      className="relative cursor-pointer"
      onClick={() => conversationOnSelect(conversation.id)}
    >
      <div className="absolute left-2 top-1 flex size-6 items-center justify-center">
        <IconMessage className="mr-2" />
      </div>
      <div
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'group w-full pl-8 pr-16',
          selected && 'bg-accent',
        )}
      >
        <div
          className="relative max-h-5 flex-1 select-none overflow-hidden text-ellipsis break-all"
          title={conversation.title}
        >
          <span className="whitespace-nowrap">{conversation.title}</span>
        </div>
      </div>
    </div>
  );
}
