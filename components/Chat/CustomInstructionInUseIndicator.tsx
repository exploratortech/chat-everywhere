import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { PluginID } from '@/types/plugin';

import HomeContext from '@/pages/api/home/home.context';

const CustomInstructionInUseIndicator = () => {
  const { t } = useTranslation('chat');
  const {
    state: { selectedConversation, currentMessage },
  } = useContext(HomeContext);
  const isInChatMode =
    currentMessage?.pluginId === null ||
    currentMessage?.pluginId === PluginID.LANGCHAIN_CHAT ||
    currentMessage?.pluginId === PluginID.GPT4;
  if (selectedConversation?.customInstructionPrompt && isInChatMode) {
    const customInstructionPromptName =
      selectedConversation.customInstructionPrompt.name.trim().length > 10
        ? selectedConversation.customInstructionPrompt.name
            .trim()
            .substring(0, 10) + '...'
        : selectedConversation.customInstructionPrompt.name.trim();
    return (
      <div className="group relative h-2 w-2 mx-2 cursor-pointer">
        <div className="h-2 w-2 bg-green-500 rounded-full absolute"></div>
        <div className="h-2 w-2 bg-green-500 rounded-full animate-ping absolute"></div>
        <span className="absolute top-6 scale-0 rounded bg-gray-800 p-2 text-xs text-white group-hover:scale-100 !w-max">
          {t('Custom Instruction ({{customInstructionPromptName}}) is in use', {
            customInstructionPromptName,
          })}
        </span>
      </div>
    );
  } else if (selectedConversation?.customInstructionPrompt) {
    return (
      <div className="group relative h-2 w-2 mx-2">
        <div className="h-2 w-2 bg-red-500 rounded-full absolute"></div>
        <span className="absolute top-6 scale-0 rounded bg-gray-800 p-2 text-xs text-white !w-max">
          {`Custom Instruction only available in Chat mode`}
        </span>
      </div>
    );
  }

  return null;
};

export default CustomInstructionInUseIndicator;
