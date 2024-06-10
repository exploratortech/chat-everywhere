import { useContext } from 'react';

import {
  saveConversation,
  saveConversations,
  updateConversationLastUpdatedAtTimeStamp,
} from '@/utils/app/conversation';
import { generateComponentHTML } from '@/utils/app/htmlStringHandler';

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
  const html = await generateComponentHTML({
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
  const updatedMessages: Message[] = selectedConversation.messages.map(
    (message, index) => {
      if (index === messageIndex) {
        return {
          ...message,
          // TODO: Replace only the html content of the message that has the same job id, and not the whole message
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
}
