import { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCreateReducer } from '@/hooks/useCreateReducer';
import useMediaQuery from '@/hooks/useMediaQuery';

import {
  getNonDeletedCollection,
  updateConversationLastUpdatedAtTimeStamp,
} from '@/utils/app/conversation';
import { savePrompts } from '@/utils/app/prompts';
import { generateRank } from '@/utils/app/rank';

import { OpenAIModels } from '@/types/openai';
import { Prompt } from '@/types/prompt';

import { PromptFolders } from './components/PromptFolders';
import { Prompts } from './components/Prompts';
import HomeContext from '@/components/home/home.context';

import Sidebar from '../Sidebar';
import PromptbarContext from './PromptBar.context';
import { PromptbarInitialState, initialState } from './Promptbar.state';

import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

const Promptbar = () => {
  const { t } = useTranslation('promptbar');

  const promptBarContextValue = useCreateReducer<PromptbarInitialState>({
    initialState,
  });

  const {
    state: { prompts, defaultModelId, showChatbar, showPromptbar, currentDrag },
    dispatch: homeDispatch,
    handleCreateFolder,
    handleCreatePrompt,
    togglePromptbar,
  } = useContext(HomeContext);

  const isMobileLayout = useMediaQuery('(max-width: 640px)');

  const showMobileButtons = useMemo(() => {
    return isMobileLayout && !showChatbar;
  }, [isMobileLayout, showChatbar]);

  const {
    state: { searchTerm, filteredPrompts },
    dispatch: promptDispatch,
  } = promptBarContextValue;

  const handleDeletePrompt = (prompt: Prompt) => {
    const updatedPrompts = prompts.map((p) => {
      if (p.id === prompt.id) {
        return {
          ...prompt,
          deleted: true,
        };
      }

      return p;
    });

    homeDispatch({ field: 'prompts', value: updatedPrompts });
    savePrompts(updatedPrompts);
    updateConversationLastUpdatedAtTimeStamp();
  };

  const handleUpdatePrompt = (prompt: Prompt) => {
    const updatedPrompts = prompts.map((p) => {
      if (p.id === prompt.id) {
        return {
          ...prompt,
          lastUpdateAtUTC: dayjs().valueOf(),
        };
      }

      return p;
    });
    homeDispatch({ field: 'prompts', value: updatedPrompts });

    savePrompts(updatedPrompts);

    updateConversationLastUpdatedAtTimeStamp();
  };

  const handleDrop = (e: any) => {
    if (currentDrag) {
      const prompt = currentDrag.data as Prompt;

      const updatedPrompt = {
        ...prompt,
        folderId: e.target.dataset.folderId,
      };

      handleUpdatePrompt(updatedPrompt);

      e.target.style.background = 'none';
    }
  };

  useEffect(() => {
    if (searchTerm) {
      promptDispatch({
        field: 'filteredPrompts',
        value: getNonDeletedCollection(
          prompts.filter((prompt) => {
            const searchable =
              prompt.name.toLowerCase() +
              ' ' +
              prompt.description.toLowerCase() +
              ' ' +
              prompt.content.toLowerCase();
            return searchable.includes(searchTerm.toLowerCase());
          }),
        ),
      });
    } else {
      promptDispatch({
        field: 'filteredPrompts',
        value: getNonDeletedCollection(prompts),
      });
    }
  }, [searchTerm, prompts]);

  return (
    <PromptbarContext.Provider
      value={{
        ...promptBarContextValue,
        handleDeletePrompt,
        handleUpdatePrompt,
      }}
    >
      <Sidebar<Prompt>
        side={'right'}
        isOpen={showPromptbar}
        addItemButtonTitle={t('New prompt')}
        itemComponent={
          <Prompts
            prompts={filteredPrompts.filter(
              (prompt) => prompt.folderId == null,
            )}
          />
        }
        folderComponent={<PromptFolders />}
        items={filteredPrompts}
        searchTerm={searchTerm}
        handleSearchTerm={(searchTerm: string) =>
          promptDispatch({ field: 'searchTerm', value: searchTerm })
        }
        toggleOpen={togglePromptbar}
        handleCreateItem={handleCreatePrompt}
        handleCreateFolder={() => handleCreateFolder(t('New folder'), 'prompt')}
        handleDrop={handleDrop}
        showMobileButton={showMobileButtons}
      />
    </PromptbarContext.Provider>
  );
};

export default Promptbar;
