import * as React from 'react';
import { useInView } from 'react-intersection-observer';

import { useAtBottom } from '@/hooks/v2Chat/use-at-bottom';

interface ChatScrollAnchorProps {
  trackVisibility?: boolean;
  ref: React.RefObject<any>; // replace any with the type of your ref
}

const ChatScrollAnchor = React.forwardRef(
  ({ trackVisibility }: ChatScrollAnchorProps, ref) => {
    const isAtBottom = useAtBottom();
    const {
      ref: inViewRef,
      entry,
      inView,
    } = useInView({
      trackVisibility,
      delay: 100,
      rootMargin: '0px 0px -150px 0px',
    });

    React.useEffect(() => {
      if (isAtBottom && trackVisibility && !inView) {
        entry?.target.scrollIntoView({
          block: 'start',
        });
      }
    }, [inView, entry, isAtBottom, trackVisibility]);

    // Expose scroll to bottom function
    React.useImperativeHandle(ref, () => ({
      scrollToBottom: () => {
        entry?.target.scrollIntoView({ block: 'start' });
      },
    }));

    return <div ref={inViewRef} className="h-px w-full" />;
  },
);

ChatScrollAnchor.displayName = 'ChatScrollAnchor';
export { ChatScrollAnchor };
