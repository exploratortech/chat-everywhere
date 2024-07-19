import { useContext } from 'react';

import { event } from 'nextjs-google-analytics/dist/interactions';

import { getOrGenerateUserId } from '@/utils/data/taggingHelper';

import HomeContext from '@/components/home/home.context';

export const useLogger = () => {
  const {
    state: { user },
  } = useContext(HomeContext);

  const logGeneralEvent = (eventName: string) => {
    // Fail silently to avoid impacting user experience
    try {
      let eventPayload = {
        category: 'Usages',
        userEmail: user?.email || 'N/A',
        user_type: user ? user?.plan : 'no-login',
        user_id: user ? user?.email : getOrGenerateUserId(),
      } as any;

      event(eventName, eventPayload);
    } catch (e) {}
  };

  return { logGeneralEvent };
};
