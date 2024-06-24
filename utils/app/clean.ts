import { Conversation } from '@/types/chat';
import { FolderInterface } from '@/types/folder';
import { OpenAIModelID, OpenAIModels } from '@/types/openai';
import { Prompt } from '@/types/prompt';

import {
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_TEMPERATURE,
  RANK_INTERVAL,
} from './const';

import dayjs from 'dayjs';

export const cleanSelectedConversation = (conversation: Conversation) => {
  // added model for each conversation (3/20/23)
  // added system prompt for each conversation (3/21/23)
  // added folders (3/23/23)
  // added prompts (3/26/23)

  let updatedConversation = conversation;

  // check for model on each conversation
  if (!updatedConversation.model) {
    updatedConversation = {
      ...updatedConversation,
      model: updatedConversation.model || OpenAIModels[OpenAIModelID.GPT_3_5],
    };
  }

  // check for system prompt on each conversation
  if (!updatedConversation.prompt) {
    updatedConversation = {
      ...updatedConversation,
      prompt: updatedConversation.prompt || DEFAULT_SYSTEM_PROMPT,
    };
  }

  if (!updatedConversation.temperature) {
    updatedConversation = {
      ...updatedConversation,
      temperature: updatedConversation.temperature || DEFAULT_TEMPERATURE,
    };
  }

  if (!updatedConversation.folderId) {
    updatedConversation = {
      ...updatedConversation,
      folderId: updatedConversation.folderId || null,
    };
  }

  return updatedConversation;
};

export const cleanConversationHistory = (history: any[]): Conversation[] => {
  // added model for each conversation (3/20/23)
  // added system prompt for each conversation (3/21/23)
  // added folders (3/23/23)
  // added prompts (3/26/23)

  if (!Array.isArray(history)) {
    console.warn('history is not an array. Returning an empty array.');
    return [];
  }

  return history.reduce((acc: any[], conversation: any, index: number) => {
    try {
      if (!conversation.model) {
        conversation.model = OpenAIModels[OpenAIModelID.GPT_3_5];
      }

      if (!conversation.prompt) {
        conversation.prompt = DEFAULT_SYSTEM_PROMPT;
      }

      if (!conversation.temperature) {
        conversation.temperature = DEFAULT_TEMPERATURE;
      }

      if (!conversation.folderId) {
        conversation.folderId = null;
      }

      if (!conversation.lastUpdateAtUTC) {
        conversation.lastUpdateAtUTC = dayjs().valueOf();
      }

      if (!conversation.rank) {
        conversation.rank = (index + 1) * RANK_INTERVAL;
      }

      acc.push(conversation);
      return acc;
    } catch (error) {
      console.warn(
        `error while cleaning conversations' history. Removing culprit`,
        error,
      );
    }
    return acc;
  }, []);
};

export const cleanFolders = (folders: FolderInterface[]): FolderInterface[] => {
  return folders.reduce(
    (acc: FolderInterface[], folder: FolderInterface, index) => {
      if (!folder.rank) {
        folder.rank = (index + 1) * RANK_INTERVAL;
      }
      acc.push(folder);
      return acc;
    },
    [],
  );
};

export const cleanPrompts = (
  prompts: Prompt[],
  folders: FolderInterface[],
): Prompt[] => {
  const cleanedPrompts = prompts.reduce(
    (acc: Prompt[], prompt: Prompt, index) => {
      if (!prompt.rank) {
        prompt.rank = (index + 1) * RANK_INTERVAL;
      }
      acc.push(prompt);
      return acc;
    },
    [],
  );
  // Clean the dirtied prompts
  const promptFolderIds = new Set(
    folders
      .filter((folder) => folder.type === 'prompt')
      .map((folder) => folder.id),
  );

  for (const prompt of cleanedPrompts) {
    if (prompt.folderId && !promptFolderIds.has(prompt.folderId)) {
      prompt.folderId = null;
      prompt.deleted = true;
    }
  }
  return cleanedPrompts;
};
