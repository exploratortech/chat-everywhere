// useAutoScroll.ts
import { useEffect, useRef } from 'react';

export const useAutoScroll = (
  shouldScroll: boolean,
  handleScroll: () => void,
  interval: number = 200,
) => {
  const intervalId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (shouldScroll) {
      intervalId.current = setInterval(handleScroll, interval);
    } else if (intervalId.current) {
      clearInterval(intervalId.current);
    }
    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [shouldScroll, handleScroll, interval]);
};
