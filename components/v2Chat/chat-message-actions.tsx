'use client';

import { useCopyToClipboard } from '@/hooks/v2Chat/use-copy-to-clipboard';

import { cn } from '@/utils/v2Chat/utils';

import { type MessageType } from '@/types/v2Chat/chat';

import { Button } from '@/components/v2Chat/ui/button';
import { IconCheck, IconCopy } from '@/components/v2Chat/ui/icons';

interface ChatMessageActionsProps extends React.ComponentProps<'div'> {
  message: MessageType;
  show: boolean;
}

export function ChatMessageActions({
  message,
  show,
  className,
  ...props
}: ChatMessageActionsProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  const onCopy = () => {
    if (isCopied) return;
    copyToClipboard(message.content);
  };

  return (
    <div
      className={cn(
        'flex items-center justify-end transition-opacity group-hover:opacity-100 absolute -right-10 -top-2 opacity-0',
        className,
      )}
      {...props}
    >
      <div className={`${show ? '' : 'w-8 h-8'}`}>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCopy}
          className={`${show ? '' : 'hidden'}`}
        >
          {isCopied ? <IconCheck /> : <IconCopy />}
          <span className="sr-only">Copy message</span>
        </Button>
      </div>
    </div>
  );
}
