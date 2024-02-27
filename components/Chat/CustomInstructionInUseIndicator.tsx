import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PluginID } from '@/types/plugin';

import CustomInstructionInUseDisplayModel from '../Promptbar/components/CustomInstructionInUseDisplayModel';

import HomeContext from '../home/home.context';

import { cn } from '@/lib/utils';

const CustomInstructionInUseIndicator = () => {
  const { t } = useTranslation('chat');
  const {
    state: { selectedConversation, currentMessage },
  } = useContext(HomeContext);
  const isInChatMode =
    currentMessage?.pluginId === null ||
    currentMessage?.pluginId === PluginID.LANGCHAIN_CHAT ||
    currentMessage?.pluginId === PluginID.GPT4;

  const [showModal, setShowModal] = useState(false);
  if (selectedConversation?.customInstructionPrompt && isInChatMode) {
    const isTeacherCustomInstructionPrompt =
      selectedConversation.customInstructionPrompt.is_teacher_prompt;
    const customInstructionPromptName =
      selectedConversation.customInstructionPrompt.name.trim().length > 10
        ? selectedConversation.customInstructionPrompt.name
            .trim()
            .substring(0, 10) + '...'
        : selectedConversation.customInstructionPrompt.name.trim();
    return (
      <>
        <div
          className="group relative h-2 w-2 mx-2 cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          <div
            className={cn(
              'h-2 w-2',
              isTeacherCustomInstructionPrompt ? 'bg-blue-500' : 'bg-green-500',
              'rounded-full absolute',
            )}
          ></div>
          <div
            className={cn(
              'h-2 w-2 rounded-full animate-ping absolute',
              isTeacherCustomInstructionPrompt ? 'bg-blue-500' : 'bg-green-500',
            )}
          ></div>
          <span className="absolute top-6 scale-0 rounded bg-gray-800 p-2 text-xs text-white group-hover:scale-100 !w-max">
            {t(
              'Custom Instruction ({{customInstructionPromptName}}) is in use',
              {
                customInstructionPromptName,
              },
            )}
          </span>
        </div>
        {showModal && (
          <CustomInstructionInUseDisplayModel
            prompt={selectedConversation.customInstructionPrompt}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  } else if (selectedConversation?.customInstructionPrompt) {
    return (
      <>
        <div className="group relative h-2 w-2 mx-2">
          <div className="h-2 w-2 bg-red-500 rounded-full absolute"></div>
          <span className="absolute top-6 scale-0 rounded bg-gray-800 p-2 text-xs text-white !w-max">
            {t('Custom Instruction only available in Chat mode')}
          </span>
        </div>
        {showModal && (
          <CustomInstructionInUseDisplayModel
            prompt={selectedConversation.customInstructionPrompt}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  return null;
};

export default CustomInstructionInUseIndicator;
