import { useEffect, useMemo, useState } from 'react';

import { User } from '@/types/user';

import usePreviousState from './usePreviousState';

function useLimiter(user: User | null, messageIsStreaming: boolean) {
  const previousMessageIsStreaming = usePreviousState(messageIsStreaming);
  const [intervalRemaining, setIntervalRemaining] = useState(() => {
    const savedValue = localStorage.getItem('intervalRemaining');
    return savedValue ? parseInt(savedValue) : 0;
  });

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
      setIntervalRemaining(maxInterval);
    }
  }, [maxInterval, messageIsStreaming, previousMessageIsStreaming, user]);

  // Disable local storage for now
  // useEffect(() => {
  //   localStorage.setItem('intervalRemaining', intervalRemaining.toString());
  // }, [intervalRemaining]);

  return { intervalRemaining, setIntervalRemaining, maxInterval };
}

export default useLimiter;
