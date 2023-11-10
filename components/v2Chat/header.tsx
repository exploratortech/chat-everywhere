import React from 'react';

import { cn } from '@/utils/v2Chat/utils';

import type { UserProfile } from '@/types/user';

import { Sidebar } from '@/components/v2Chat/sidebar';
import { SidebarList } from '@/components/v2Chat/sidebar-list';
import { buttonVariants } from '@/components/v2Chat/ui/button';
import { IconGitHub, IconSeparator } from '@/components/v2Chat/ui/icons';

export function Header({ userProfile }: { userProfile: UserProfile }) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-center">
        <div className="flex items-center">
          <IconSeparator className="w-6 h-6 text-muted-foreground/50" />
          <Sidebar>
            <SidebarList userId={userProfile.id} />
          </Sidebar>
        </div>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <a
          target="_blank"
          href="https://github.com/exploratortech/chat-everywhere"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          <IconGitHub />
          <span className="hidden ml-2 md:flex">GitHub</span>
        </a>
      </div>
    </header>
  );
}
