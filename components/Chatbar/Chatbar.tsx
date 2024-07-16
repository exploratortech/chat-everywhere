import { useContext, useEffect, useMemo, useState } from 'react';

import { useTranslation } from 'next-i18next';
import { event } from 'nextjs-google-analytics';

import { useCreateReducer } from '@/hooks/useCreateReducer';
import useMediaQuery from '@/hooks/useMediaQuery';

import { newDefaultConversation } from '@/utils/app/const';
import {
  getNonDeletedCollection,
  saveConversation,
  saveConversations,
} from '@/utils/app/conversation';
import {
  handleExportData,
  handleImportConversations,
} from '@/utils/app/importExport';

import type { Conversation } from '@/types/chat';
import type { SupportedExportFormats } from '@/types/export';

import { ChatFolders } from './components/ChatFolders';
import { ChatbarSettings } from './components/ChatbarSettings';
import { Conversations } from './components/Conversations';
import HomeContext from '@/components/home/home.context';

import Sidebar from '../Sidebar';
import ChatbarContext from './Chatbar.context';
import type { ChatbarInitialState } from './Chatbar.state';
import { initialState } from './Chatbar.state';

export const Chatbar = () => {
  const { t } = useTranslation('sidebar');

  const chatBarContextValue = useCreateReducer<ChatbarInitialState>({
    initialState,
  });

  const {
    state: {
      conversations,
      showChatbar,
      defaultModelId,
      showPromptbar,
      selectedConversation,
    },
    dispatch: homeDispatch,
    handleCreateFolder,
    handleNewConversation,
    toggleChatbar,
  } = useContext(HomeContext);

  const isMobileLayout = useMediaQuery('(max-width: 640px)');

  const showMobileButtons = useMemo(() => {
    return isMobileLayout && !showPromptbar;
  }, [isMobileLayout, showPromptbar]);

  const {
    state: { searchTerm, filteredConversations },
    dispatch: chatDispatch,
  } = chatBarContextValue;

  const [isImportingData, setIsImportingData] = useState(false);

  const handleDeleteConversation = (conversation: Conversation) => {
    const updatedConversations = conversations.map((c) => {
      if (c.id === conversation.id) {
        return {
          ...c,
          deleted: true,
        };
      }
      return c;
    });

    homeDispatch({ field: 'conversations', value: updatedConversations });
    chatDispatch({ field: 'searchTerm', value: '' });
    saveConversations(updatedConversations);

    if (updatedConversations.length > 0) {
      homeDispatch({
        field: 'selectedConversation',
        value: updatedConversations[updatedConversations.length - 1],
      });

      saveConversation(updatedConversations[updatedConversations.length - 1]);
    } else {
      defaultModelId &&
        homeDispatch({
          field: 'selectedConversation',
          value: newDefaultConversation,
        });

      localStorage.removeItem('selectedConversation');
    }

    event('interaction', {
      category: 'Conversation',
      label: 'Delete Conversation',
    });
  };

  useEffect(() => {
    if (searchTerm) {
      chatDispatch({
        field: 'filteredConversations',
        value: getNonDeletedCollection(
          conversations.filter((conversation) => {
            const searchable =
              conversation.name.toLocaleLowerCase() +
              ' ' +
              conversation.messages.map((message) => message.content).join(' ');
            return searchable.toLowerCase().includes(searchTerm.toLowerCase());
          }),
        ),
      });
    } else {
      chatDispatch({
        field: 'filteredConversations',
        value: getNonDeletedCollection(conversations),
      });
    }
  }, [searchTerm, conversations]);

  return (
    <ChatbarContext.Provider
      value={{
        ...chatBarContextValue,
        handleDeleteConversation,
        handleImportConversations: (data: SupportedExportFormats) => {
          handleImportConversations(
            data,
            homeDispatch,
            selectedConversation,
            setIsImportingData,
          );
        },
        handleExportData,
      }}
    >
      <Sidebar<Conversation>
        side={'left'}
        isOpen={showChatbar}
        addItemButtonTitle={t('New chat')}
        itemComponent={
          <Conversations
            conversations={filteredConversations.filter(
              (conversation) => conversation.folderId == null,
            )}
          />
        }
        itemsIsImporting={isImportingData}
        folderComponent={<ChatFolders searchTerm={searchTerm} />}
        items={filteredConversations}
        searchTerm={searchTerm}
        handleSearchTerm={(searchTerm: string) =>
          chatDispatch({ field: 'searchTerm', value: searchTerm })
        }
        toggleOpen={toggleChatbar}
        handleCreateItem={handleNewConversation}
        handleCreateFolder={() => handleCreateFolder(t('New folder'), 'chat')}
        footerComponent={<ChatbarSettings />}
        showMobileButton={showMobileButtons}
      />
    </ChatbarContext.Provider>
  );
};
