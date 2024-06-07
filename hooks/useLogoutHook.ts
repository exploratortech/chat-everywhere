import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { saveConversations } from '@/utils/app/conversation';
import { clearUserInfo } from '@/utils/app/eventTracking';

import { OpenAIModels } from '@/types/openai';

import HomeContext from '@/components/home/home.context';
import { initialState } from '@/components/home/home.state';

import { v4 as uuidv4 } from 'uuid';

const useLogoutHook = () => {
  const supabase = useSupabaseClient();
  const { t } = useTranslation('chat');

  const resetStateOnLogout = ({
    clearConversationHistory = false,
  }: {
    clearConversationHistory?: boolean;
  }) => {
    const newState = {
      ...initialState,
      // Preserve the values of the specified properties
      loading: state.loading,
      lightMode: state.lightMode,
      messageIsStreaming: state.messageIsStreaming,
      modelError: state.modelError,
      folders: state.folders,
      conversations: state.conversations,
      selectedConversation: state.selectedConversation,
      currentMessage: state.currentMessage,
      prompts: state.prompts,
      temperature: state.temperature,
      showChatbar: state.showChatbar,
      showPromptbar: state.showPromptbar,
      currentFolder: state.currentFolder,
      messageError: state.messageError,
      searchTerm: state.searchTerm,
      defaultModelId: state.defaultModelId,
      outputLanguage: state.outputLanguage,
      currentDrag: state.currentDrag,
    };
    if (clearConversationHistory) {
      newState.conversations = [];
      newState.prompts = [];
      newState.folders = [];
    }

    dispatch({ type: 'partialReset', payload: newState });
  };
  const { state, dispatch } = useContext(HomeContext);

  const actualUserLogout = async ({
    clearBrowserChatHistory = false,
  }: {
    clearBrowserChatHistory: boolean;
  }) => {
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token;

    let shouldClearConversationsOnLogout = false;
    if (state.isTempUser) {
      shouldClearConversationsOnLogout = (
        await fetchShouldClearConversationsOnLogout(accessToken)
      ).should_clear_conversations_on_logout;
    }
    await supabase.auth.signOut();

    if (shouldClearConversationsOnLogout || clearBrowserChatHistory) {
      resetStateOnLogout({
        clearConversationHistory: true,
      });
      saveConversations([]);
      state.defaultModelId &&
        dispatch({
          field: 'selectedConversation',
          value: {
            id: uuidv4(),
            name: 'New conversation',
            messages: [],
            model: OpenAIModels[state.defaultModelId],
            prompt: DEFAULT_SYSTEM_PROMPT,
            temperature: DEFAULT_TEMPERATURE,
            folderId: null,
          },
        });
      localStorage.removeItem('selectedConversation');
    } else {
      resetStateOnLogout({});
    }

    dispatch({
      field: 'featureFlags',
      value: {
        'enable-conversation-mode': false,
      },
    });

    toast.success(t('You have been logged out'));
    clearUserInfo();
  };

  useEffect(() => {
    if (state.isRequestingLogout) {
      // if the user is requesting logout, we need to wait for the conversation to be synced
      if (!state.syncingConversation) {
        actualUserLogout({
          clearBrowserChatHistory:
            state.isRequestingLogout.clearBrowserChatHistory,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isRequestingLogout, state.syncingConversation]);

  const handleUserLogout = ({
    clearBrowserChatHistory = false,
  }: {
    clearBrowserChatHistory: boolean;
  }) => {
    dispatch({
      field: 'isRequestingLogout',
      value: {
        clearBrowserChatHistory,
      },
    });
  };

  return {
    handleUserLogout,
  };
};

export default useLogoutHook;

const fetchShouldClearConversationsOnLogout = async (
  accessToken: string | undefined,
) => {
  try {
    if (!accessToken) {
      throw new Error('No access token');
    }
    const res = await fetch('/api/teacher-settings-for-student-logout', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
      },
    });
    if (!res.ok) {
      throw new Error('Failed to fetch teacher Settings');
    }
    const data = await res.json();
    return data as {
      should_clear_conversations_on_logout: boolean;
    };
  } catch (error) {
    console.error(error);
    return {
      should_clear_conversations_on_logout: false,
    };
  }
};
