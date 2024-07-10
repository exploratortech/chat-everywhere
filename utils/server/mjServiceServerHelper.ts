import { MjJob } from '@/types/mjJob';

import {
  PayloadType,
  serverSideTrackEvent,
  serverSideTrackSystemEvent,
} from '../app/eventTracking';

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
      mjQueueJobDetail: jobInfo,
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
      mjQueueJobDetail: jobInfo,
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

export const trackCleanupJobEvent = ({
  event,
  executedAt,
  enqueuedAt,
  oneWeekAgo,
  fiveMinutesAgo,
}: {
  event:
  | 'MJ Queue Cleanup Completed / Failed Job'
  | 'MJ Queue Cleanup Processing Job';
  executedAt: string;
  enqueuedAt: string;
  oneWeekAgo?: string;
  fiveMinutesAgo?: string;
}) => {
  const trackEventPromise = serverSideTrackSystemEvent(event, {
    mjQueueCleanupJobEnqueuedAt: enqueuedAt,
    mjQueueCleanupJobOneWeekAgo: oneWeekAgo,
    mjQueueCleanupJobFiveMinutesAgo: fiveMinutesAgo,
    mjQueueCleanupExecutedAt: executedAt,
  });
  return trackEventPromise;
};

export const OriginalMjLogEvent = async ({
  errorMessage,
  startTime,
  promptBeforeProcessing,
  generationPrompt,
  userId,
  useOnDemandCredit,
}: {
  userId: string;
  startTime: string;
  errorMessage?: string;
  promptBeforeProcessing?: string;
  generationPrompt?: string;
  useOnDemandCredit: boolean;
}) => {
  const now = dayjs().valueOf();
  const totalDurationInSeconds = (now - dayjs(startTime).valueOf()) / 1000;
  const payloadToLog: PayloadType = {
    generationLengthInSecond: totalDurationInSeconds,
    useOnDemandCredit,
  };

  if (errorMessage) {
    payloadToLog.imageGenerationFailed = 'true';
    payloadToLog.imageGenerationErrorMessage = errorMessage;
    payloadToLog.imageGenerationPrompt = `${promptBeforeProcessing || 'N/A'
      } -> ${generationPrompt || 'N/A'}`;
  }

  await serverSideTrackEvent(userId, 'AI image generation', payloadToLog);
};
