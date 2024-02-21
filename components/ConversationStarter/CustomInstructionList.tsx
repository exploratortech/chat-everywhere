import { useContext } from 'react';

import { Prompt } from '@/types/prompt';

import PromptIcon from '../Promptbar/components/PromptIcon';

import HomeContext from '../home/home.context';

const CustomInstructionList = ({
  customInstructionOnClick,
}: {
  customInstructionOnClick: (customInstructionPrompt: Prompt) => void;
}) => {
  const {
    state: { prompts },
    dispatch,
  } = useContext(HomeContext);
  const customInstructions = prompts.filter(
    (prompt) => prompt.isCustomInstruction && !prompt.deleted,
  );
  return (
    <div className="my-6">
      <h2 className="text-lg">Custom Instructions</h2>
      <div className="mt-3 flex flex-col text-sm overflow-y-auto h-64 max-h-max font-normal">
        {customInstructions.map((prompt, index) => (
          <div
            key={prompt.id}
            className="mb-2 cursor-pointer rounded-md border border-neutral-200 bg-transparent p-1 pr-2 text-neutral-400 dark:border-neutral-600 dark:text-white flex justify-center items-center"
            onClick={() => {
              customInstructionOnClick(prompt);
            }}
          >
            <div className="px-2">
              <PromptIcon prompt={prompt} size={18} />
            </div>
            <div className="flex justify-start truncate">{prompt.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomInstructionList;
