import { IconPlus } from '@tabler/icons-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { OpenAIModelID, OpenAIModels } from '@/types/openai';
import { PluginID } from '@/types/plugin';
import type { TeacherPromptForTeacherPortal } from '@/types/prompt';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import { TeacherPromptModal } from './TeacherPromptModal';

interface Props {
  onCreatePrompt: (prompt: TeacherPromptForTeacherPortal) => void;
}
const NewTeacherPromptButton = ({ onCreatePrompt }: Props) => {
  const { t } = useTranslation('model');

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

      <DialogContent className="max-h-[90dvh] overflow-y-scroll bg-white dark:bg-[#202123] mobile:h-[90dvh]">
        <TeacherPromptModal
          prompt={{
            name: '',
            description: '',
            content: '',
            is_enable: true,
            id: '',
            model: OpenAIModels[OpenAIModelID.GPT_4O],
            default_mode: PluginID.default,
            is_teacher_prompt: true,
            first_message_to_gpt: '',
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
