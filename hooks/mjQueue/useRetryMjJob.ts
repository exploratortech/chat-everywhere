import { useContext } from 'react';

import { Conversation } from '@/types/chat';
import { FailedMjJob } from '@/types/mjJob';

import HomeContext from '@/components/home/home.context';

const useRetryMjJob = (job: FailedMjJob, messageIndex: number) => {
  const {
    state: { selectedConversation },
  } = useContext(HomeContext);
  // Logic v1 :
  // If the current message has no previous mj image component v2, then retry init the job using the previous message as prompt to start
  // If the current message has a previous mj image component v2, then retry buttonCommand (it must be buttonCommand)

  // Logic v2:
  // Use the failed job to reinit the job using the mjRequest from the failed job

  return () => {
    if (!selectedConversation) return;
    if (job.status !== 'FAILED') return;
    if (job.mjRequest.type === 'MJ_IMAGE_GEN') {
      // CALL API initMjImageGen
      return;
    }
    if (job.mjRequest.type === 'MJ_BUTTON_COMMAND') {
      // CALL API initMjButtonCommand
      return;
    }
  };
};

export default useRetryMjJob;
