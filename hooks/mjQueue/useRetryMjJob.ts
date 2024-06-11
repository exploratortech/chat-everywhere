import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useContext } from 'react';

import { updateConversationWithNewContentByIdentifier } from '@/utils/app/conversation';
import {
  executeButtonCommand,
  executeNewImageGen,
} from '@/utils/app/mj-service';

import { FailedMjJob } from '@/types/mjJob';

import HomeContext from '@/components/home/home.context';

const useRetryMjJob = (job: FailedMjJob, messageIndex: number) => {
  const {
    state: { selectedConversation, conversations },
    dispatch: homeDispatch,
  } = useContext(HomeContext);
  const supabase = useSupabaseClient();

  return async () => {
    if (!selectedConversation) return;
    if (job.status !== 'FAILED') return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const accessToken = session.access_token;
    if (job.mjRequest.type === 'MJ_BUTTON_COMMAND') {
      const newHtml = await executeButtonCommand(job.mjRequest, accessToken);
      await updateConversationWithNewContentByIdentifier({
        selectedConversation,
        conversations,
        messageIndex,
        homeDispatch,
        newHtml,
        targetIdentifier: job.jobId,
      });
      return;
    }
    if (job.mjRequest.type === 'MJ_IMAGE_GEN') {
      const newHtml = await executeNewImageGen(job.mjRequest, accessToken);
      await updateConversationWithNewContentByIdentifier({
        selectedConversation,
        conversations,
        messageIndex,
        homeDispatch,
        newHtml,
        targetIdentifier: job.jobId,
      });
    }
  };
};

export default useRetryMjJob;
