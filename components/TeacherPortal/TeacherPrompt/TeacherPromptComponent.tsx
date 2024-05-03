import { useState } from 'react';

import useTeacherPrompt from '@/hooks/teacherPortal/useTeacherPrompt';

import { TeacherPromptForTeacherPortal } from '@/types/prompt';

import { TeacherPromptModal } from '@/components/TeacherPortal/TeacherPrompt/TeacherPromptModal';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

import { cn } from '@/lib/utils';

interface Props {
  prompt: TeacherPromptForTeacherPortal;
}

export const TeacherPromptComponent = ({ prompt }: Props) => {
  const { updateMutation } = useTeacherPrompt();
  const { mutate: updatePrompt } = updateMutation;
  const handleUpdate = (prompt: TeacherPromptForTeacherPortal) => {
    updatePrompt(prompt);
  };

  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={() => setOpen(false)}>
      <div className="w-full cursor-pointer" onClick={() => setOpen(true)}>
        <Card
          className={cn('bg-transparent', { 'opacity-40': !prompt.is_enable })}
        >
          <CardContent className="py-4">
            <div className="font-semibold leading-none items-center tracking-tight flex justify-between">
              <div className="py-2">{prompt.name}</div>
            </div>
            <div className="text-sm text-muted-foreground text-start">
              {prompt.description}
            </div>
          </CardContent>
        </Card>
      </div>
      <DialogContent className="bg-white dark:bg-[#202123] mobile:h-[90dvh] max-h-[90dvh] overflow-y-scroll">
        <TeacherPromptModal
          prompt={prompt}
          onUpdatePrompt={handleUpdate}
          onClose={() => {
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
