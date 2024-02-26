import { MouseEventHandler, useState } from 'react';

import { TeacherPrompt } from '@/types/prompt';

import { TeacherPromptModal } from '@/components/TeacherPortal/TeacherPrompt/TeacherPromptModal';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

import { cn } from '@/lib/utils';

interface Props {
  prompt: TeacherPrompt;
}

export const TeacherPromptComponent = ({ prompt }: Props) => {
  const handleUpdate = (prompt: TeacherPrompt) => {
    console.log('handleUpdate', prompt);
    // handleUpdatePrompt(prompt);
    // promptDispatch({ field: 'searchTerm', value: '' });
  };

  // TODO: add is enable display
  return (
    <Dialog>
      <DialogTrigger className="w-full">
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
      </DialogTrigger>
      <DialogContent className="bg-white dark:bg-[#202123] mobile:h-[100dvh]">
        <TeacherPromptModal prompt={prompt} onUpdatePrompt={handleUpdate} />
      </DialogContent>
    </Dialog>
  );
};
