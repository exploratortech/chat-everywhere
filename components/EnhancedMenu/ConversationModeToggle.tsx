import React, { useContext } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useCognitiveService } from '../CognitiveService/CognitiveServiceProvider';
import HomeContext from '../home/home.context';

const ConversationModeToggle = () => {
  const { t } = useTranslation(['common', 'feature', 'model']);

  const {
    state: { user },
  } = useContext(HomeContext);

  const { isConversationModeActive, setIsConversationModeActive } =
    useCognitiveService();

  const handleChange = () => {
    if (isConversationModeActive) {
      setIsConversationModeActive(false);
    } else {
      if (!user || user.plan === 'free') {
        toast.error(
          t(
            "This is a Pro only feature. Please sign-up to use it if you don't have an account.",
            { ns: 'feature' },
          ),
        );
      } else {
        setIsConversationModeActive(true);
      }
    }
  };

  return (
    <div className="flex flex-row items-center justify-between py-1">
      <label className="mr-2 whitespace-nowrap text-left text-sm text-neutral-700 dark:text-neutral-400">
        {t('Conversation mode', { ns: 'model' })}
      </label>
      <label
        htmlFor="toggleHiddenChatEverywhereDefaultCharacterPrompt"
        className="relative inline-flex cursor-pointer items-center"
      >
        <input
          type="checkbox"
          id="toggleHiddenChatEverywhereDefaultCharacterPrompt"
          className="peer sr-only"
          checked={isConversationModeActive}
          onChange={handleChange}
        />
        <div className="peer h-6 w-11 rounded-full bg-gray-200 outline-none after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-400 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 dark:border-gray-600 dark:bg-gray-700"></div>
      </label>
    </div>
  );
};

export default ConversationModeToggle;
