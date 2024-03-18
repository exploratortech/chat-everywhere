import { IconPlus } from '@tabler/icons-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_FIRST_MESSAGE_TO_GPT } from '@/utils/app/const';

import { OpenAIModelID, OpenAIModels } from '@/types/openai';
import { PluginID } from '@/types/plugin';
import { TeacherPromptForTeacherPortal } from '@/types/prompt';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

import { TeacherPromptModal } from './TeacherPromptModal';

interface Props {
  onCreatePrompt: (prompt: TeacherPromptForTeacherPortal) => void;
}
const NewTeacherPromptButton = ({ onCreatePrompt }: Props) => {
  const { t } = useTranslation('model');
  const { t: promptT } = useTranslation('prompts');

  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={() => setOpen(false)}>
      <div>
        <Button
          variant={'ghost'}
          size={'default'}
          className=" text-neutral-500"
          onClick={() => setOpen(true)}
        >
          <div className="flex items-center gap-1">
            <IconPlus size={18} />
            {t('Add new teacher prompt')}
          </div>
        </Button>
      </div>

      <DialogContent className="sm:max-w-md text-white">
        <TeacherPromptModal
          prompt={{
            name: '',
            description: '',
            content: '',
            is_enable: true,
            id: '',
            model: OpenAIModels[OpenAIModelID.GPT_4],
            default_mode: PluginID.default,
            is_teacher_prompt: true,
            first_message_to_gpt: promptT(DEFAULT_FIRST_MESSAGE_TO_GPT),
          }}
          onUpdatePrompt={onCreatePrompt}
          onClose={() => {
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default NewTeacherPromptButton;
