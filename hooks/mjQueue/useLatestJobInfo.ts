import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { updateConversationWithNewContentByIdentifier } from '@/utils/app/conversation';
import { MjQueueJobComponentHandler } from '@/utils/app/streamHandler';

import { FailedMjJob } from './../../types/mjJob';
import { MjJob } from '@/types/mjJob';

import HomeContext from '@/components/home/home.context';

const useLatestJobInfo = (initialJob: MjJob, messageIndex: number) => {
  const [job, setJob] = useState<MjJob>(initialJob);
  const {
    state: { selectedConversation, conversations },
    dispatch: homeDispatch,
  } = useContext(HomeContext);
  const { t: mjImageT } = useTranslation('mjImage');

  useEffect(() => {
    const componentGenerator = new MjQueueJobComponentHandler();
    const getLatestJobInfoToChat = async () => {
      // 1. Get the latest job info from the server
      const response = await fetch(`api/mj-queue/get`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'job-id': job.jobId,
        },
      });
      let updatedJob: MjJob;
      if (response.ok) {
        updatedJob = (await response.json()) as MjJob;
      } else {
        updatedJob = {
          jobId: job.jobId,
          status: 'FAILED',
          reason: mjImageT('Request expired, please click regenerate to retry'),
          enqueuedAt: job.enqueuedAt,
        } as FailedMjJob;
      }
      setJob(updatedJob);

      // If JOB not completed, no need to update the job info in the local storage
      if (updatedJob.status === 'QUEUED' || updatedJob.status === 'PROCESSING')
        return;

      // 2. Update the job info in the local storage
      const newHtml = await componentGenerator.generateComponentHTML({
        job: updatedJob,
      });

      if (selectedConversation) {
        await updateConversationWithNewContentByIdentifier({
          conversations,
          selectedConversation,
          messageIndex,
          homeDispatch,
          newHtml,
          targetIdentifier: job.jobId,
        });
      }
    };
    if (job.status === 'QUEUED' || job.status === 'PROCESSING') {
      const intervalId = setInterval(getLatestJobInfoToChat, 2000); // Poll every 2 seconds
      return () => clearInterval(intervalId); // Cleanup on component unmount or job update
    }
  }, [
    conversations,
    homeDispatch,
    job,
    messageIndex,
    mjImageT,
    selectedConversation,
  ]);
  return job;
};

export default useLatestJobInfo;
