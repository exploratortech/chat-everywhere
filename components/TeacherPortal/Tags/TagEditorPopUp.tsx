import React, { useState, useEffect } from 'react';
import { StudentMessageSubmission } from '@/types/share-messages-by-teacher-profile';
import { Tag as TagType } from '@/types/tags';
import EditableTagSelector from './EditableTagSelector';

const TagEditorPopup = ({
  selectedMessageIds,
  submissions,
  allTags,
}: {
  selectedMessageIds: number[];
  submissions?: StudentMessageSubmission[];
  allTags: TagType[];
}) => {
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);
  const [isInitialSelectionDone, setIsInitialSelectionDone] = useState(false);
  
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

  return (
    <div>
      <EditableTagSelector
        allTags={allTags}
        selectedTags={selectedTags}
        onTagSelectionChange={handleTagSelectionChange}
      />
    </div>
  );
};

export default TagEditorPopup;