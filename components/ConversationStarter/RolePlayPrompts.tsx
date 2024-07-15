import { IconSchool } from '@tabler/icons-react';
import type { FC } from 'react';
import { useContext } from 'react';

import { useTranslation } from 'next-i18next';

import type { Prompt, TeacherPrompt } from '@/types/prompt';

import PromptIcon from '../Promptbar/components/PromptIcon';

import HomeContext from '../home/home.context';

import dayjs from 'dayjs';

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
    state: { prompts, teacherPrompts, isTempUser, teacherSettings },
  } = useContext(HomeContext);
  const customInstructions = prompts.filter(
    (prompt) => prompt.isCustomInstruction && !prompt.deleted,
  );
  const formattedTeacherPrompts: Prompt[] = teacherPrompts.map((prompt) => ({
    ...prompt,
    folderId: null,
    lastUpdateAtUTC: dayjs().valueOf(),
    rank: 0,
    isCustomInstruction: true,
  }));
  const isStudent = isTempUser;

  return (
    <div className="mt-5 flex h-64 max-h-[25vh] flex-col overflow-y-auto text-sm font-normal">
      {formattedTeacherPrompts.map((prompt) => (
        <div
          key={prompt.id}
          className="mb-2 flex cursor-pointer items-center justify-center rounded-md border border-neutral-200 bg-transparent p-1 pr-2 text-neutral-400 dark:border-neutral-600 dark:text-white"
          onClick={() => {
            customInstructionOnClick({
              ...prompt,
              is_teacher_prompt: true,
            } as TeacherPrompt);
          }}
        >
          <div className="px-2">
            <IconSchool color="#247ce9" size={18} />
          </div>
          <div className="flex justify-start truncate">{prompt.name}</div>
        </div>
      ))}
      {customInstructions.map((prompt) => (
        <div
          key={prompt.id}
          className="mb-2 flex cursor-pointer items-center justify-center rounded-md border border-neutral-200 bg-transparent p-1 pr-2 text-neutral-400 dark:border-neutral-600 dark:text-white"
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
      {(!isStudent ||
        !teacherSettings.hidden_chateverywhere_default_character_prompt) &&
        DEMO_ROLES.map((roleName, index) => (
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
