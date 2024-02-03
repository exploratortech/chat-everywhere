import { useContext } from 'react';

import HomeContext from '@/pages/api/home/home.context';

import PromptIcon from '../Promptbar/components/PromptIcon';

const CustomInstructionList = ({
  customInstructionOnClick,
}: {
  customInstructionOnClick: (prompt: string) => void;
}) => {
  const {
    state: { prompts },
    dispatch,
  } = useContext(HomeContext);
  const customInstructions = prompts.filter(
    (prompt) => prompt.isCustomInstruction,
  );
  return (
    <div className="my-6">
      <h2>Custom Instructions</h2>
      <div className="mt-5 flex flex-col text-sm overflow-y-auto h-64 max-h-max font-normal">
        {customInstructions.map((prompt, index) => (
          <div
            key={prompt.id}
            className="mb-2 cursor-pointer rounded-md border border-neutral-200 bg-transparent p-1 pr-2 text-neutral-400 dark:border-neutral-600 dark:text-white flex justify-center items-center"
            onClick={() => {
              customInstructionOnClick(prompt.content);
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
