import { useContext, useEffect, useState } from 'react';

import {
  saveConversation,
  saveConversations,
  updateConversationLastUpdatedAtTimeStamp,
} from '@/utils/app/conversation';
import { MjQueueJobComponentHandler } from '@/utils/app/streamHandler';

import { FailedMjJob } from './../../types/mjJob';
import { Conversation, Message } from '@/types/chat';
import { MjJob } from '@/types/mjJob';

import HomeContext from '@/components/home/home.context';

import dayjs from 'dayjs';

const useLatestJobInfo = (initialJob: MjJob, messageIndex: number) => {
  const [job, setJob] = useState<MjJob>(initialJob);
  const {
    state: { selectedConversation, conversations },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

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
          reason: 'Job expired, please re-generate the mj image',
          enqueuedAt: job.enqueuedAt,
        } as FailedMjJob;
      }
      setJob(updatedJob);

      // 2. Update the job info in the local storage
      const html = await componentGenerator.generateComponentHTML({
        job: updatedJob,
      });

      if (selectedConversation) {
        updateConversationWithNewJobInfo(
          selectedConversation,
          conversations,
          messageIndex,
          html,
          homeDispatch,
        );
      }
    };
    if (job.status === 'QUEUED' || job.status === 'PROCESSING') {
      const intervalId = setInterval(getLatestJobInfoToChat, 2000); // Poll every 2 seconds
      return () => clearInterval(intervalId); // Cleanup on component unmount or job update
    }
  }, [conversations, homeDispatch, job, messageIndex, selectedConversation]);
  return job;
};

export default useLatestJobInfo;

const updateConversationWithNewJobInfo = (
  selectedConversation: Conversation,
  conversations: Conversation[],
  messageIndex: number,
  html: string,
  homeDispatch: Function,
) => {
  const updatedMessages: Message[] = selectedConversation.messages.map(
    (message, index) => {
      if (index === messageIndex) {
        return {
          ...message,
          content: html,
        };
      }
      return message;
    },
  );
  const updatedConversation = {
    ...selectedConversation,
    messages: updatedMessages,
    lastUpdateAtUTC: dayjs().valueOf(),
  };
  const updatedConversations: Conversation[] = conversations.map(
    (conversation) => {
      if (conversation.id === selectedConversation.id) {
        return updatedConversation;
      }
      return conversation;
    },
  );
  homeDispatch({
    field: 'selectedConversation',
    value: updatedConversation,
  });

  saveConversation(updatedConversation);
  homeDispatch({
    field: 'conversations',
    value: updatedConversations,
  });
  saveConversations(updatedConversations);
  updateConversationLastUpdatedAtTimeStamp();
};
