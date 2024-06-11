import { MjJob } from '@/types/mjJob';

import { serverSideTrackEvent } from '../app/eventTracking';

import dayjs from 'dayjs';

export const trackFailedEvent = (jobInfo: MjJob, errorMessage: string) => {
  const now = dayjs().valueOf();
  const totalDurationInSeconds =
    (now - dayjs(jobInfo.enqueuedAt).valueOf()) / 1000;
  const totalWaitingInQueueTimeInSeconds =
    (dayjs(jobInfo.startProcessingAt).valueOf() -
      dayjs(jobInfo.enqueuedAt).valueOf()) /
    1000;
  const totalProcessingTimeInSeconds =
    (now - dayjs(jobInfo.startProcessingAt).valueOf()) / 1000;

  const trackEventPromise = serverSideTrackEvent(
    jobInfo.userId,
    'MJ Image Gen Failed',
    {
      mjImageGenType: jobInfo.mjRequest.type,
      mjImageGenButtonCommand:
        jobInfo.mjRequest.type === 'MJ_BUTTON_COMMAND'
          ? jobInfo.mjRequest.button
          : undefined,
      mjImageGenTotalDurationInSeconds: totalDurationInSeconds,
      mjImageGenTotalWaitingInQueueTimeInSeconds:
        totalWaitingInQueueTimeInSeconds,
      mjImageGenTotalProcessingTimeInSeconds: totalProcessingTimeInSeconds,
      mjImageGenErrorMessage: errorMessage,
    },
  );
  return trackEventPromise;
};

export const trackSuccessEvent = (jobInfo: MjJob) => {
  const now = dayjs().valueOf();
  const totalDurationInSeconds =
    (now - dayjs(jobInfo.enqueuedAt).valueOf()) / 1000;
  const totalWaitingInQueueTimeInSeconds =
    (dayjs(jobInfo.startProcessingAt).valueOf() -
      dayjs(jobInfo.enqueuedAt).valueOf()) /
    1000;
  const totalProcessingTimeInSeconds =
    (now - dayjs(jobInfo.startProcessingAt).valueOf()) / 1000;

  const trackEventPromise = serverSideTrackEvent(
    jobInfo.userId,
    'MJ Image Gen Completed',
    {
      mjImageGenType: jobInfo.mjRequest.type,
      mjImageGenButtonCommand:
        jobInfo.mjRequest.type === 'MJ_BUTTON_COMMAND'
          ? jobInfo.mjRequest.button
          : undefined,
      mjImageGenTotalDurationInSeconds: totalDurationInSeconds,
      mjImageGenTotalWaitingInQueueTimeInSeconds:
        totalWaitingInQueueTimeInSeconds,
      mjImageGenTotalProcessingTimeInSeconds: totalProcessingTimeInSeconds,
    },
  );

  return trackEventPromise;
};
