import { useCallback, useContext, useEffect } from 'react';

import { updateConversationWithNewContentByIdentifier } from '@/utils/app/conversation';
import { generateComponentHTML } from '@/utils/app/htmlStringHandler';

import type { CompletedMjJob, FailedMjJob } from '@/types/mjJob';

import MjImageSelectorV2 from '@/components/Chat/components/MjImageSelectorV2';
import HomeContext from '@/components/home/home.context';

const useReplaceCompletedContent = (
  job: CompletedMjJob | FailedMjJob,
  messageIndex: number,
) => {
  const {
    state: { selectedConversation, conversations },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const replaceCompletedContent = useCallback(async () => {
    if (selectedConversation && job.status === 'COMPLETED') {
      const newHtml = await generateComponentHTML({
        component: MjImageSelectorV2,
        props: {
          buttonMessageId: job.messageId,
          imageUrl: job.imageUrl,
          buttons: job.buttons,
          prompt:
            job.mjRequest.type === 'MJ_IMAGE_GEN'
              ? job.mjRequest.enhancedPrompt
              : '',
        },
      });

      await updateConversationWithNewContentByIdentifier({
        selectedConversation,
        conversations,
        messageIndex,
        homeDispatch,
        targetIdentifier: job.jobId,
        newHtml,
      });
    }
  }, [selectedConversation, conversations, messageIndex, homeDispatch, job]);

  useEffect(() => {
    if (selectedConversation && job.status === 'COMPLETED') {
      replaceCompletedContent();
    }
  }, [job.status, replaceCompletedContent, selectedConversation]);
};

export default useReplaceCompletedContent;
