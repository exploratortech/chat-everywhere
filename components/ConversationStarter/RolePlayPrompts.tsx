import { FC, useContext } from 'react';

import { useTranslation } from 'next-i18next';

import { Prompt } from '@/types/prompt';

import PromptIcon from '../Promptbar/components/PromptIcon';

import HomeContext from '../home/home.context';

const DEMO_ROLES = [
  'Accountant',
  'Writing Tutor',
  'Life Coach',
  'Psychologist',
  'Social Media Influencer',
  'Career Counselor',
  'Personal Trainer',
  'Mental Health Adviser',
  'Web Design Consultant',
  'Automobile Mechanic',
  'Financial Analyst',
  'Dream Interpreter',
  'IELTS Tester',
];

type Props = {
  roleOnClick: (roleName: string, roleContent: string) => void;
  customInstructionOnClick: (customInstructionPrompt: Prompt) => void;
};

export const RolePlayPrompts: FC<Props> = ({
  roleOnClick,
  customInstructionOnClick,
}) => {
  const { t: roleNameT } = useTranslation('roles');
  const { t: roleContentT } = useTranslation('rolesContent');

  const {
    state: { prompts },
  } = useContext(HomeContext);
  const customInstructions = prompts.filter(
    (prompt) => prompt.isCustomInstruction && !prompt.deleted,
  );
  return (
    <div className="mt-5 flex flex-col text-sm overflow-y-auto h-64 max-h-[25vh] font-normal">
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
      {DEMO_ROLES.map((roleName, index) => (
        <div
          key={index}
          className="mb-2 cursor-pointer rounded-md border border-neutral-200 bg-transparent p-1 pr-2 text-neutral-400 dark:border-neutral-600 dark:text-white"
          onClick={() => {
            roleOnClick(roleNameT(roleName), roleContentT(roleName));
          }}
        >
          {roleNameT(roleName)}
        </div>
      ))}
    </div>
  );
};
