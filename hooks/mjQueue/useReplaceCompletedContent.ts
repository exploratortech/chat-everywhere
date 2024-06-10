import { useContext } from 'react';

import {
  saveConversation,
  saveConversations,
  updateConversationLastUpdatedAtTimeStamp,
} from '@/utils/app/conversation';
import {
  generateComponentHTML,
  swapHtmlSegmentByDataIdentifier,
} from '@/utils/app/htmlStringHandler';

import { Conversation, Message } from '@/types/chat';
import { CompletedMjJob, FailedMjJob } from '@/types/mjJob';

import MjImageSelectorV2 from '@/components/Chat/components/MjImageSelectorV2';
import HomeContext from '@/components/home/home.context';

import dayjs from 'dayjs';

const useReplaceCompletedContent = (
  job: CompletedMjJob | FailedMjJob,
  messageIndex: number,
) => {
  const {
    state: { selectedConversation, conversations },
    dispatch: homeDispatch,
  } = useContext(HomeContext);
  if (selectedConversation && job.status === 'COMPLETED') {
    console.log('completed job add MjImageSelectorV2toConversation');
    addMjImageSelectorV2toConversation(
      selectedConversation,
      conversations,
      messageIndex,
      homeDispatch,
      job,
    );
  }
};

export default useReplaceCompletedContent;

async function addMjImageSelectorV2toConversation(
  selectedConversation: Conversation,
  conversations: Conversation[],
  messageIndex: number,
  homeDispatch: Function,
  job: CompletedMjJob,
) {
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

  const swappedContent = swapHtmlSegmentByDataIdentifier(
    selectedConversation.messages[messageIndex].content,
    job.jobId,
    newHtml,
  );
  console.log({
    swappedContent,
  });
  const updatedMessages: Message[] = selectedConversation.messages.map(
    (message, index) => {
      if (index === messageIndex) {
        if (swappedContent) {
          return {
            ...message,
            content: swappedContent,
          };
        }
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
}
