import React, { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useSharedMessagesWithTeacher from '@/hooks/useSharedMessagesWithTeacher';
import { Button } from '../ui/button';
import { Tag } from '@/types/tags';
import TagEditorPopup from './Tags/TagEditorPopUp';
import { StudentMessageSubmission } from '@/types/share-messages-by-teacher-profile';

import { cn } from '@/lib/utils';

const FloatMenu = ({
  selectedMessageIds,
  setSelectedMessageIds,
  submissions,
  tags,
}: {
  selectedMessageIds: number[];
  setSelectedMessageIds: Dispatch<SetStateAction<number[]>>;
  submissions?: StudentMessageSubmission[];
  tags: Tag[];
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

  // State to manage tag editing popup visibility
  const [isTagEditorVisible, setIsTagEditorVisible] = useState(false);
  const toggleTagEditor = () => {
    setIsTagEditorVisible(!isTagEditorVisible);
  };
  
  return (
    <div
      className={cn(
        'transition ease-in-out transform pointer-events-auto px-4 py-2 bg-neutral-900/90 rounded-lg h-min shadow-md border',
        selectedMessageIds.length > 0 ? 'opacity-100' : 'opacity-0',
        selectedMessageIds.length > 0
          ? 'translate-y-[-50%]'
          : 'translate-y-[1.5rem]',
      )}
    >
      <div className={cn('flex items-center')}>
        {isTagEditorVisible ? (
          <>
          <TagEditorPopup
            selectedMessageIds={selectedMessageIds}
            submissions={submissions}
            allTags={tags}
            setIsTagEditorVisible={setIsTagEditorVisible}
          />
          <Button
            variant={'link'}
            size={'lg'}
            onClick={() => {
              setIsTagEditorVisible(false);
            }}
          >
            {t('Go back')}
          </Button>
          </>
        ) : (
          <>
            <Button
              variant={'ghost'}
              className="hover:bg-destructive"
              size={'lg'}
              onClick={handleRemove}
            >
              {`${t('Remove')} (${selectedMessageIds.length})`}
            </Button>
            <Button
              variant={'ghost'}
              className="hover:bg-neutral-700"
              size={'lg'}
              onClick={toggleTagEditor}
            >
              {`${t('Edit Tags')}`}
            </Button>
            <Button
            variant={'link'}
            size={'lg'}
            onClick={() => {
              setSelectedMessageIds([]);
            }}
          >
            {t('Clear')}
          </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default FloatMenu;
