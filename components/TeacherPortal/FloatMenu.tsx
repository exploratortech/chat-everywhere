import React, { Dispatch, SetStateAction, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import useSharedMessagesWithTeacher from '@/hooks/useSharedMessagesWithTeacher';

import { Button } from '../ui/button';

import { cn } from '@/lib/utils';

const FloatMenu = ({
  selectedMessageIds,
  setSelectedMessageIds,
}: {
  selectedMessageIds: number[];
  setSelectedMessageIds: Dispatch<SetStateAction<number[]>>;
}) => {
  const { t } = useTranslation('model');
  const { removeMutation } = useSharedMessagesWithTeacher();

  const handleRemove = useCallback(() => {
    removeMutation.mutate(selectedMessageIds.map(String), {
      onSuccess: () => {
        setSelectedMessageIds([]);
      },
    });
  }, [removeMutation, selectedMessageIds, setSelectedMessageIds]);

  return (
    <div
      className={cn(
        'transition transform pointer-events-auto px-4 py-2 bg-neutral-900/80 rounded-lg shadow-md border',
        selectedMessageIds.length > 0 ? 'opacity-100' : 'opacity-0',
        selectedMessageIds.length > 0 ? 'translate-y-[-100%]' : 'translate-y-0',
      )}
    >
      <div className={cn('flex gap-4')}>
        <Button
          variant={'ghost'}
          className="hover:bg-neutral-700"
          size={'lg'}
          onClick={handleRemove}
        >
          {`${t('Remove')} (${selectedMessageIds.length})`}
        </Button>
        <Button
          variant={'link'}
          size={'lg'}
          onClick={() => setSelectedMessageIds([])}
        >
          <div className="flex gap-2">{t('Clear')}</div>
        </Button>
      </div>
    </div>
  );
};

export default FloatMenu;
