import { useEffect, useMemo, useState } from 'react';

import type { User } from '@/types/user';

import usePreviousState from './usePreviousState';

function useLimiter(user: User | null, messageIsStreaming: boolean) {
  const previousMessageIsStreaming = usePreviousState(messageIsStreaming);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [intervalRemaining, setIntervalRemaining] = useState(0);

  const maxInterval = useMemo(() => {
    const isProUser = user && (user.plan === 'pro' || user.plan === 'edu');
    if (isProUser) return 0;

    const isFreeUser = user && user.plan === 'free';
    const interval = isFreeUser
      ? process.env.NEXT_PUBLIC_FREE_USER_MESSAGE_INTERVAL
      : process.env.NEXT_PUBLIC_NON_LOGIN_USER_MESSAGE_INTERVAL;
    return interval ? parseInt(interval) : 0;
  }, [user]);

  useEffect(() => {
    if (previousMessageIsStreaming && !messageIsStreaming) {
      setStartTime(Date.now());
    }
  }, [maxInterval, messageIsStreaming, previousMessageIsStreaming, user]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (startTime !== null) {
      timer = setInterval(() => {
        const remaining = maxInterval - (Date.now() - startTime);
        setIntervalRemaining(remaining);

        if (remaining <= 0) {
          setStartTime(null);
        }
      }, 50);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [startTime, maxInterval]);

  return { intervalRemaining, startTime, setStartTime, maxInterval };
}

export default useLimiter;
