import { useContext, useEffect } from 'react';

import { MjJob } from '@/types/mjJob';

import HomeContext from '@/components/home/home.context';

const useIsStreaming = (job: MjJob) => {
  const {
    state: { messageIsStreaming },
    dispatch: homeDispatch,
  } = useContext(HomeContext);
  useEffect(() => {
    if (job.status === 'PROCESSING' || job.status === 'QUEUED') {
      homeDispatch({ field: 'loading', value: true });
      homeDispatch({ field: 'messageIsStreaming', value: true });
    } else {
      homeDispatch({ field: 'loading', value: false });
      homeDispatch({ field: 'messageIsStreaming', value: false });
    }
  }, [homeDispatch, job]);
  return messageIsStreaming;
};

export default useIsStreaming;
