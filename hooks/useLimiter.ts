import { useEffect, useMemo, useState } from 'react';

import SubscriptionPlan from '@/utils/app/SubscriptionPlan';

import { User } from '@/types/user';

import usePreviousState from './usePreviousState';

function useLimiter(
  user: User,
  subscriptionPlan: SubscriptionPlan | null,
  messageIsStreaming: boolean,
) {
  const previousMessageIsStreaming = usePreviousState(messageIsStreaming);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [intervalRemaining, setIntervalRemaining] = useState(0);

  const maxInterval = useMemo(() => {
    if (!subscriptionPlan?.hasChatLimit()) return 0;

    const interval = user
      ? process.env.NEXT_PUBLIC_FREE_USER_MESSAGE_INTERVAL
      : process.env.NEXT_PUBLIC_NON_LOGIN_USER_MESSAGE_INTERVAL;
    return interval ? parseInt(interval) : 0;
  }, [user, subscriptionPlan]);

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
