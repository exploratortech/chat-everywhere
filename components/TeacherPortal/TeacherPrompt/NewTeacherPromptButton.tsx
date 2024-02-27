import { IconPlus } from '@tabler/icons-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { OpenAIModelID, OpenAIModels } from '@/types/openai';
import { TeacherPrompt } from '@/types/prompt';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

import { TeacherPromptModal } from './TeacherPromptModal';

interface Props {
  onCreatePrompt: (prompt: TeacherPrompt) => void;
}
const NewTeacherPromptButton = ({ onCreatePrompt }: Props) => {
  const { t } = useTranslation('model');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={'ghost'}
          size={'default'}
          className=" text-neutral-500"
        >
          <div className="flex items-center gap-1">
            <IconPlus size={18} />
            {t('Add new teacher prompt')}
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md text-white">
        <TeacherPromptModal
          prompt={{
            name: '',
            description: '',
            content: '',
            is_enable: true,
            id: '',
            model: OpenAIModels[OpenAIModelID.GPT_4],
          }}
          onUpdatePrompt={onCreatePrompt}
        />
      </DialogContent>
    </Dialog>
  );
};

export default NewTeacherPromptButton;
