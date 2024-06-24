import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { updateConversationWithNewContentByIdentifier } from '@/utils/app/conversation';
import { trackEvent } from '@/utils/app/eventTracking';
import { MjQueueJobComponentHandler } from '@/utils/app/streamHandler';

import { FailedMjJob } from './../../types/mjJob';
import { MjJob } from '@/types/mjJob';

import HomeContext from '@/components/home/home.context';

import dayjs from 'dayjs';

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
        const now = dayjs().valueOf();
        const totalDurationInSeconds =
          (now - dayjs(job.enqueuedAt).valueOf()) / 1000;
        const totalWaitingInQueueTimeInSeconds =
          (dayjs(job.startProcessingAt).valueOf() -
            dayjs(job.enqueuedAt).valueOf()) /
          1000;
        const totalProcessingTimeInSeconds =
          (now - dayjs(job.startProcessingAt).valueOf()) / 1000;

        trackEvent('MJ Image Gen Failed', {
          mjQueueJobDetail: job,
          mjImageGenType: job.mjRequest.type,
          mjImageGenButtonCommand:
            job.mjRequest.type === 'MJ_BUTTON_COMMAND'
              ? job.mjRequest.button
              : undefined,
          mjImageGenTotalDurationInSeconds: totalDurationInSeconds,
          mjImageGenTotalWaitingInQueueTimeInSeconds:
            totalWaitingInQueueTimeInSeconds,
          mjImageGenTotalProcessingTimeInSeconds: totalProcessingTimeInSeconds,
          mjImageGenErrorMessage: updatedJob.reason,
        });
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
      let isRequestInProgress = false;

      const intervalId = setInterval(async () => {
        if (!isRequestInProgress) {
          isRequestInProgress = true;
          await getLatestJobInfoToChat();
          isRequestInProgress = false;
        }
      }, 3000);

      return () => clearInterval(intervalId);
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
