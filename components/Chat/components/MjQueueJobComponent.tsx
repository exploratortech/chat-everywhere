import ProgressBar from '@ramonak/react-progress-bar';
import { IconCheck, IconX } from '@tabler/icons-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import useLatestJobInfo from '@/hooks/mjQueue/useLatestJobInfo';
import useReplaceCompletedContent from '@/hooks/mjQueue/useReplaceCompletedContent';
import useRetryMjJob from '@/hooks/mjQueue/useRetryMjJob';
import useIsStreaming from '@/hooks/useIsStreaming';

import {
  CompletedMjJob,
  FailedMjJob,
  MjJob,
  ProcessingMjJob,
  QueuedMjJob,
} from '@/types/mjJob';

import Spinner from '@/components/Spinner';
import { Button } from '@/components/ui/button';

import dayjs from 'dayjs';

const MjQueueJobComponent = ({
  job: initialJob,
  messageIndex,
}: {
  job: MjJob;
  messageIndex: number;
}) => {
  const job = useLatestJobInfo(initialJob, messageIndex);
  const isStreaming = useIsStreaming(job);

  if (job.status === 'PROCESSING' || job.status === 'QUEUED') {
    return <ProcessingJobComponent job={job} />;
  } else {
    return (
      <CompletedJobComponent
        job={job}
        isStreaming={isStreaming}
        messageIndex={messageIndex}
      />
    );
  }
};

export default MjQueueJobComponent;

const ProcessingJobComponent = ({
  job,
}: {
  job: ProcessingMjJob | QueuedMjJob;
}) => {
  const { t: mjImageT } = useTranslation('mjImage');

  const ProcessingContent = () => {
    if (job.status !== 'PROCESSING') {
      return <></>;
    }
    if (job.mjRequest.type === 'MJ_IMAGE_GEN') {
      // Only MJ_IMAGE_GEN has enhancedPrompt
      if (!job.mjRequest.enhancedPrompt) {
        return <div>{`✨ ${mjImageT('Enhancing your prompt...')}`}</div>;
      } else {
        return (
          <>
            <div>{`📝 ${mjImageT('Prompt used')}: ${
              job.mjRequest.enhancedPrompt
            }`}</div>
            <div>{`🚀 ${mjImageT(
              'Mid Journey AI is processing your request...',
            )}`}</div>
          </>
        );
      }
    } else if (job.progress === 0) {
      return (
        <div>{`🚀 ${mjImageT(
          'Mid Journey AI is processing your request...',
        )}`}</div>
      );
    }
    return <></>;
  };
  return (
    <details
      className={`relative my-4 block text-black rounded-lg bg-white`}
      open
    >
      <summary className="cursor-pointer p-2 flex gap-2 items-center justify-between">
        <div className="flex gap-2 items-center flex-grow font-bold">
          <Spinner size="16px" />
          {mjImageT(job.status)}

          {job.status === 'PROCESSING' && !!job.progress && (
            <ProgressBar
              completed={job.progress ? +job.progress : 1}
              className="basis-[50%]"
              bgColor="#70cc60"
              height="15px"
              labelSize="12px"
              isLabelVisible={!!(job.progress && job.progress > 20)}
            />
          )}
        </div>
      </summary>
      <main>
        <div className="panel p-2 max-h-full whitespace-pre-line">
          {job.status === 'QUEUED' && (
            <div>{`${mjImageT('Queue Position')}: ${job.position}`}</div>
          )}
          <div>{`${mjImageT('Enqueued At')}: ${dayjs(job.enqueuedAt).format(
            'YYYY-MM-DD HH:mm:ss',
          )}`}</div>
          <ProcessingContent />

          {job.status === 'PROCESSING' && job.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.imageUrl} alt="content" />
          )}
        </div>
      </main>
    </details>
  );
};

const CompletedJobComponent = ({
  job,
  messageIndex,
  isStreaming,
}: {
  job: CompletedMjJob | FailedMjJob;
  messageIndex: number;
  isStreaming: boolean;
}) => {
  const { t } = useTranslation('common');
  const { t: chatT } = useTranslation('chat');
  const { t: mjImageT } = useTranslation('mjImage');
  useReplaceCompletedContent(job, messageIndex);

  const retryJob = useRetryMjJob(messageIndex);

  const [retryLoading, setRetryLoading] = useState(false);
  const handleRetry = () => {
    setRetryLoading(true);
    if (job.status === 'FAILED' && !job.mjRequest) {
      alert(mjImageT('Request expired, please click regenerate to retry'));
      return;
    }
    if (job.status === 'FAILED' && job.mjRequest) {
      retryJob(job).finally(() => {
        setRetryLoading(false);
      });
    }
  };

  return (
    <details
      className={`${job.status === 'COMPLETED' ? 'bg-green-200' : ''} ${
        job.status === 'FAILED' ? 'bg-red-200' : ''
      } relative my-4 block text-black rounded-lg`}
      open
    >
      <summary className="cursor-pointer p-2 flex gap-2 items-center justify-between">
        <div className="flex gap-2 items-center flex-grow font-bold">
          {job.status === 'FAILED' && <IconX size="16px" />}
          {job.status === 'COMPLETED' && <IconCheck size="16px" />}

          {mjImageT(job.status)}
        </div>
      </summary>
      <main>
        <div className="panel p-2 max-h-full whitespace-pre-line">
          {`${mjImageT('Enqueued At')}: ${dayjs(job.enqueuedAt).format(
            'YYYY-MM-DD HH:mm:ss',
          )}`}
        </div>
        {job.status === 'COMPLETED' && (
          <div className="panel p-2 max-h-full whitespace-pre-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={job.imageUrl} alt="content" />
          </div>
        )}
        {job.status === 'FAILED' && job.reason && (
          <div className="panel p-2 max-h-full whitespace-pre-line">
            {`${t('Error')}: ${chatT(job.reason)} `}
          </div>
        )}
        {/* If a job is expired it may not have a mjRequest */}
        {job.status === 'FAILED' && job.mjRequest && (
          <div className="w-full flex my-3 justify-center">
            <Button
              variant={'destructive'}
              className="px-8"
              onClick={() => {
                handleRetry();
              }}
              disabled={retryLoading || isStreaming}
            >
              <div className="flex items-center">
                {retryLoading && <Spinner />}
                {t('Retry')}
              </div>
            </Button>
          </div>
        )}
      </main>
    </details>
  );
};
