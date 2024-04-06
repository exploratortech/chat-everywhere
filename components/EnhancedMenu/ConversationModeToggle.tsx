import React from 'react';
import { useTranslation } from 'react-i18next';

const ConversationModeToggle = () => {
  const { t } = useTranslation('model');

  return (
    <div className="flex flex-row items-center justify-between py-1">
      <label className="text-left text-sm text-neutral-700 dark:text-neutral-400 mr-2 whitespace-nowrap">
        {t('Conversation mode')}
      </label>
      <label
        htmlFor="toggleHiddenChatEverywhereDefaultCharacterPrompt"
        className="inline-flex relative items-center cursor-pointer"
      >
        <input
          type="checkbox"
          id="toggleHiddenChatEverywhereDefaultCharacterPrompt"
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 outline-none peer-focus:outline-none peer-focus:ring-4 peer-focus:transparent rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-400"></div>
      </label>
    </div>
  );
};

export default ConversationModeToggle;
