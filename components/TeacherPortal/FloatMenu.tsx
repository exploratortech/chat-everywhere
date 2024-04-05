import React, { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import useSharedMessagesWithTeacher from '@/hooks/useSharedMessagesWithTeacher';
import { StudentMessageSubmission } from '@/types/share-messages-by-teacher-profile';

import { Button } from '../ui/button';
import { Tag as TagType } from '@/types/tags';
import Tag from './Tags/Tag';
import { cn } from '@/lib/utils';

const FloatMenu = ({
  selectedMessageIds,
  setSelectedMessageIds,
  submissions
}: {
  selectedMessageIds: number[];
  setSelectedMessageIds: Dispatch<SetStateAction<number[]>>;
  submissions?: StudentMessageSubmission[];
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

  // Function to toggle the tag editing popup
  const toggleTagEditor = () => {
    setIsTagEditorVisible(!isTagEditorVisible);
  };

  return (
    <div
      className={cn(
        'transition transform pointer-events-auto px-4 py-2 bg-neutral-900/90 rounded-lg shadow-md border',
        selectedMessageIds.length > 0 ? 'opacity-100' : 'opacity-0',
        selectedMessageIds.length > 0 ? 'translate-y-[-100%]' : 'translate-y-0',
      )}
    >
      <div className={cn('flex gap-4')}>
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
          <div className="flex gap-2">{t('Edit Tags')}</div>
        </Button>
        <Button
          variant={'link'}
          size={'lg'}
          onClick={() => setSelectedMessageIds([])}
        >
          <div className="flex gap-2">{t('Clear')}</div>
        </Button>
      </div>
      <div>
        {isTagEditorVisible && (
          <TagEditorPopup
            selectedMessageIds={selectedMessageIds}
            submissions = {submissions}
          />
        )}
      </div>
    </div>
  );
};

export default FloatMenu;

const TagEditorPopup = ({
  selectedMessageIds,
  submissions
}: {
  selectedMessageIds: number[];
  submissions?: StudentMessageSubmission[];
}) => {
  return (
    <div className="tag-editor-popup">
      {
        submissions
          ?.filter(submission => selectedMessageIds.includes(submission.id))
          .reduce((uniqueTags: TagType[], submission) => {
            submission.message_tags.forEach((tag: TagType) => {
              if (!uniqueTags.find((uniqueTag: TagType) => uniqueTag.id === tag.id)) {
                uniqueTags.push(tag);
              }
            });
            return uniqueTags;
          }, [])
          .map(tag => (
            <Tag
              key={tag.id}
              label={tag.name}
              count={tag.message_count}
              onSelect={() => {
                // Handle tag selection
              }}
            />
          ))
      }
      {/* Popup content goes here */}
    </div>
  );
};