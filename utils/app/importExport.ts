import { Dispatch } from 'react';

import { ActionType } from '@/hooks/useCreateReducer';

import { Conversation } from '@/types/chat';
import {
  ExportFormatV1,
  ExportFormatV2,
  ExportFormatV3,
  ExportFormatV4,
  LatestExportFormat,
  SupportedExportFormats,
} from '@/types/export';

import { HomeInitialState } from '@/pages/api/home/home.state';

import { RANK_INTERVAL } from './const';
import { cleanConversationHistory, cleanFolders, cleanPrompts } from './clean';
import { trackEvent } from './eventTracking';

import dayjs from 'dayjs';

export function isExportFormatV1(obj: any): obj is ExportFormatV1 {
  return Array.isArray(obj);
}

export function isExportFormatV2(obj: any): obj is ExportFormatV2 {
  return !('version' in obj) && 'folders' in obj && 'history' in obj;
}

export function isExportFormatV3(obj: any): obj is ExportFormatV3 {
  return obj.version === 3;
}

export function isExportFormatV4(obj: any): obj is ExportFormatV4 {
  return obj.version === 4;
}

export const isLatestExportFormat = isExportFormatV4;

export function cleanData(data: SupportedExportFormats): LatestExportFormat {
  if (isExportFormatV1(data)) {
    return {
      version: 4,
      history: cleanConversationHistory(data),
      folders: [],
      prompts: [],
    };
  }

  if (isExportFormatV2(data)) {
    return {
      version: 4,
      history: cleanConversationHistory(data.history || []),
      folders: (data.folders || []).map((chatFolder, index) => ({
        id: chatFolder.id.toString(),
        name: chatFolder.name,
        type: 'chat',
        rank: index * RANK_INTERVAL,
        lastUpdateAtUTC: dayjs().valueOf(),
      })),
      prompts: [],
    };
  }

  if (isExportFormatV3(data)) {
    return {
      ...data,
      version: 4,
      history: cleanConversationHistory(data.history),
      folders: cleanFolders(data.folders),
      prompts: [],
    };
  }

  if (isExportFormatV4(data)) {
    return {
      ...data,
      history: cleanConversationHistory(data.history),
      folders: cleanFolders(data.folders),
      prompts: cleanPrompts(data.prompts),
    };
  }

  throw new Error('Unsupported data format');
}

function currentDate() {
  const date = new Date();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}-${day}`;
}

export const getExportableData = (): LatestExportFormat => {
  const history = localStorage.getItem('conversationHistory');
  const folders = localStorage.getItem('folders');
  const prompts = localStorage.getItem('prompts');

  return {
    version: 4,
    history: history ? JSON.parse(history) : [],
    folders: folders ? JSON.parse(folders) : [],
    prompts: prompts ? JSON.parse(prompts) : [],
  };
};

export const exportData = () => {
  let history = localStorage.getItem('conversationHistory');
  let folders = localStorage.getItem('folders');
  let prompts = localStorage.getItem('prompts');

  if (history) {
    history = JSON.parse(history);
  }

  if (folders) {
    folders = JSON.parse(folders);
  }

  if (prompts) {
    prompts = JSON.parse(prompts);
  }

  const data = {
    version: 4,
    history: history || [],
    folders: folders || [],
    prompts: prompts || [],
  } as LatestExportFormat;

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `chateverywhere_history_${currentDate()}.json`;
  link.href = url;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importData = (
  data: SupportedExportFormats,
): LatestExportFormat => {
  const cleanedData = cleanData(data);
  const { history, folders, prompts } = cleanedData;

  const conversations = history;
  localStorage.setItem('conversationHistory', JSON.stringify(conversations));
  localStorage.setItem(
    'selectedConversation',
    JSON.stringify(conversations[conversations.length - 1]),
  );

  localStorage.setItem('folders', JSON.stringify(folders));
  localStorage.setItem('prompts', JSON.stringify(prompts));

  return cleanedData;
};
export const handleImportConversations = (
  data: SupportedExportFormats,
  homeDispatch: Dispatch<ActionType<HomeInitialState>>,
  selectedConversation: Conversation | undefined,
  setIsLoading?: (value: boolean) => void,
) => {
  if (setIsLoading) {
    setIsLoading(true);
  }
  try {
    const { history, folders, prompts }: LatestExportFormat = importData(data);
    homeDispatch({ field: 'conversations', value: history });
    // skip if selected conversation is already in history
    if (
      selectedConversation &&
      !history.some(
        (conversation) => conversation.id === selectedConversation.id,
      )
    ) {
      homeDispatch({
        field: 'selectedConversation',
        value: history[history.length - 1],
      });
    }
    homeDispatch({ field: 'folders', value: folders });
    homeDispatch({ field: 'prompts', value: prompts });
  } catch (err) {
    console.log(err);
  } finally {
    if (setIsLoading) {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
    trackEvent('Import conversation clicked');
  }
};

export const handleExportData = () => {
  exportData();
  trackEvent('Export conversation clicked');
};
