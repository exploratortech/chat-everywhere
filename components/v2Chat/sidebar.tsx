'use client';

import * as React from 'react';

import { Button } from '@/components/v2Chat/ui/button';
import { IconPlus, IconSidebar } from '@/components/v2Chat/ui/icons';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/v2Chat/ui/sheet';

export interface SidebarProps {
  children?: React.ReactNode;
  onNewChatClick: () => void;
}

export function Sidebar({ children, onNewChatClick }: SidebarProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="-ml-2 size-9 p-0">
          <IconSidebar className="size-6" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="inset-y-0 flex h-auto w-[300px] flex-col bg-white p-0">
        <SheetHeader className="p-4">
          <SheetTitle className="text-sm">Chat History</SheetTitle>
        </SheetHeader>
        <div className="mb-2 px-2">
          <Button
            className="h-10 w-full justify-start shadow-none"
            type="button"
            variant="outline"
            onClick={onNewChatClick}
          >
            <IconPlus className="-translate-x-2" />
            New Chat
          </Button>
        </div>
        {children}
      </SheetContent>
    </Sheet>
  );
}
