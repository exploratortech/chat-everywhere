import React, { useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { saveOutputLanguage } from '@/utils/app/outputLanguage';

import { PluginID } from '@/types/plugin';

import HomeContext from '@/components/home/home.context';

const ModeSelector = () => {
  const { t } = useTranslation('model');

  const {
    state: {
      currentMessage,
      isPaidUser,
      hasMqttConnection,
      isUltraUser,
      selectedConversation,
      featureFlags,
    },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const isChatWithDocEnabled = featureFlags['enable-chat-with-doc'];

  const currentSelectedPluginId = useMemo(() => {
    if (!currentMessage || currentMessage?.pluginId === null) {
      return 'default';
    } else {
      return currentMessage.pluginId;
    }
  }, [currentMessage]);

  const pluginOnChange = (pluginId: string) => {
    // add checker to see if the current conversation has files
    const hasFiles = selectedConversation?.messages.some(
      (message) => message.fileList && message.fileList.length > 0,
    );
    if (hasFiles && pluginId !== PluginID.GEMINI) {
      alert(
        t(
          'Sorry, only the Gemini mode supports files, please clear all files to use other mode.',
        ),
      );
      return;
    }
    homeDispatch({
      field: 'currentMessage',
      value: {
        ...currentMessage,
        pluginId: pluginId === 'default' ? null : pluginId,
      },
    });
  };

  // If the selected conversation has files, and the current selected plugin is not Gemini, switch to Gemini
  useEffect(() => {
    const hasFiles = selectedConversation?.messages.some(
      (message) => message.fileList && message.fileList.length > 0,
    );
    if (hasFiles && currentSelectedPluginId !== PluginID.GEMINI) {
      if (isUltraUser) {
        homeDispatch({
          field: 'currentMessage',
          value: {
            ...currentMessage,
            pluginId: PluginID.GEMINI,
          },
        });
      }
    }
  }, [
    selectedConversation,
    currentSelectedPluginId,
    t,
    homeDispatch,
    currentMessage,
    isUltraUser,
  ]);

  return (
    <div className="flex flex-row items-center justify-between md:justify-start">
      <label className="text-left text-sm text-neutral-700 dark:text-neutral-400 mr-2">
        {t('Mode')}
      </label>
      <div className="rounded-lg border border-neutral-200 bg-transparent text-neutral-900 dark:border-neutral-600 dark:text-white w-fit pr-1 focus:outline-none">
        <select
          className="w-max-20 bg-transparent p-2 focus:outline-none"
          placeholder={t('Select a lang') || ''}
          value={currentSelectedPluginId}
          onChange={(e) => {
            if (e.target.value === PluginID.LANGCHAIN_CHAT && !isPaidUser) {
              alert(
                t(
                  'Sorry online mode is only for Pro user, please sign up and purchase Pro plan to use this feature.',
                ),
              );
              return;
            }
            homeDispatch({ field: 'outputLanguage', value: 'default' });
            saveOutputLanguage('default');
            pluginOnChange(e.target.value);
          }}
        >
          <option
            value={'default'}
            className="dark:bg-[#343541] dark:text-white"
          >
            {t('Default mode')}
          </option>
          <option
            value={PluginID.LANGCHAIN_CHAT}
            className="dark:bg-[#343541] dark:text-white"
          >
            {t('Online mode')}
          </option>
          {isPaidUser && (
            <>
              <option
                value={PluginID.GPT4O}
                className="dark:bg-[#343541] dark:text-white text-yellow-600"
              >
                {t('GPT-4')}
              </option>
              <option
                value={PluginID.IMAGE_GEN}
                className="dark:bg-[#343541] dark:text-white text-yellow-600"
              >
                {t('AI Image')}
              </option>
              {hasMqttConnection && (
                <option
                  value={PluginID.mqtt}
                  className="dark:bg-[#343541] dark:text-white text-yellow-600"
                >
                  {t('MQTT')}
                </option>
              )}
              <option
                value={PluginID.aiPainter}
                className="dark:bg-[#343541] dark:text-white text-yellow-600"
              >
                {t('AI Painter')}
              </option>
            </>
          )}
          {isUltraUser && isChatWithDocEnabled && (
            <option
              value={PluginID.GEMINI}
              className="dark:bg-[#343541] dark:text-white text-yellow-600"
            >
              {t('Gemini')}
            </option>
          )}
        </select>
      </div>
    </div>
  );
};

export default ModeSelector;
