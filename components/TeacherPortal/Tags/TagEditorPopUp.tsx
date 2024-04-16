import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { StudentMessageSubmission } from '@/types/share-messages-by-teacher-profile';
import { Tag as TagType } from '@/types/tags';
import EditableTagSelector from './EditableTagSelector';
import toast from 'react-hot-toast';
import { Button } from '../../ui/button';
import { useTranslation } from 'react-i18next';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

const TagEditorPopup = ({
  selectedMessageIds,
  submissions,
  allTags,
  setIsTagEditorVisible,
  refetchTags
}: {
  selectedMessageIds: number[];
  submissions?: StudentMessageSubmission[];
  allTags: TagType[];
  setIsTagEditorVisible: Dispatch<SetStateAction<boolean>>;
  refetchTags: () => void;
}) => {
  const { t } = useTranslation('model');
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);
  const [isInitialSelectionDone, setIsInitialSelectionDone] = useState(false);
  const supabase = useSupabaseClient();
  
  // Reset initial selection when selectedMessageIds change
  useEffect(() => {
    setIsInitialSelectionDone(false);
  }, [selectedMessageIds]);
  
  // Effect to preselect tags based on selected submissions
  useEffect(() => {
    if (!isInitialSelectionDone) {
      const preselectedTags = submissions
        ?.filter(submission => selectedMessageIds.includes(submission.id))
        .reduce((acc: TagType[], submission) => {
          submission.message_tags.forEach(tag => {
            if (!acc.find(t => t.id === tag.id)) {
              acc.push(tag);
            }
          });
          return acc;
        }, []);

      setSelectedTags(preselectedTags || []);
      setIsInitialSelectionDone(true);
    }
  }, [selectedMessageIds, submissions, isInitialSelectionDone]);

  // Handle tag selection changes
  const handleTagSelectionChange = (tag: TagType, isSelected: boolean) => {
    setSelectedTags(prevSelectedTags => {
      if (isSelected) {
        return [...prevSelectedTags, tag];
      } else {
        return prevSelectedTags.filter(t => t.id !== tag.id);
      }
    });
  };

  const handleSaveTags = async () => {
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token;
    if (!accessToken) {
      throw new Error('No access token');
    }
    const data = {
      messageSubmissionIds: selectedMessageIds,
      tagIds: selectedTags.map(tag => tag.id),
    };
    try {
      const response = await fetch('/api/teacher-portal/bulk-edit-tags-for-selected-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access-token': accessToken,
        },
        body: JSON.stringify(data),
      });
      const responseBody = await response.json();
      if (!response.ok || !responseBody.success) {
        toast.error(t('Failed to update tags'));
        return;
      }
      toast.success(t('Tags updated successfully'));
      refetchTags();
      setIsTagEditorVisible(false);
    } catch (error) {
        toast.error('Failed to update tags');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-wrap gap-2 items-center">
        <EditableTagSelector
          allTags={allTags}
          selectedTags={selectedTags}
          onTagSelectionChange={handleTagSelectionChange}
        />
      </div>
      <Button
        variant={'ghost'}
        className="hover:bg-green-700"
        size={'lg'}
        onClick={handleSaveTags}
      >
        {t('Save')}
      </Button>
    </div>
  );
};

export default TagEditorPopup;