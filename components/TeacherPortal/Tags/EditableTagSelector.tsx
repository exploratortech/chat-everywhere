import React from 'react';
import { Tag as TagType } from '@/types/tags';
import * as TagComponent from '@/components/TeacherPortal/Tags/Tag';

interface EditableTagSelectorProps {
  allTags: TagType[];
  selectedTags: TagType[];
  onTagSelectionChange: (tag: TagType, isSelected: boolean) => void;
}

const EditableTagSelector: React.FC<EditableTagSelectorProps> = ({
  allTags,
  selectedTags,
  onTagSelectionChange,
}) => {
  const handleTagClick = (tag: TagType) => {
    const isSelected = selectedTags.some(selectedTag => selectedTag.id === tag.id);
    onTagSelectionChange(tag, !isSelected);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {allTags.map(tag => (
        <TagComponent.default
          key={tag.id}
          label={tag.name}
          selected={selectedTags.some(t => t.id === tag.id)}
          onSelect={() => handleTagClick(tag)}
        />
      ))}
    </div>
  );
};

export default EditableTagSelector;