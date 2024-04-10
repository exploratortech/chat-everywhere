import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { Tag } from '@/types/tags';

import * as TagComponent from '@/components/TeacherPortal/Tags/Tag';
import useShareMessageFilterStore from '@/components/TeacherPortal/share-message-filter.store';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

const TagFilter = memo(({ tags }: { tags: Tag[] }) => {
  const { t } = useTranslation('model');
  const { selectedTags, addTag, removeTag, isNoTagsSelected, resetTags } =
    useShareMessageFilterStore();

  const handleTagSelectionChange = (tag: Tag, checked: boolean) => {
    if (checked) {
      addTag(tag);
    } else {
      removeTag(tag.id);
    }
  };

  return (
    <div className="relative flex flex-wrap gap-2">
      <Button
        variant={'link'}
        onClick={() => {
          resetTags();
        }}
        className={cn(
          'absolute underline top-0 left-0 text-neutral-500 hover:text-neutral-400 translate-y-[-100%] p-0',
          isNoTagsSelected() && 'invisible',
        )}
      >
        {`Clear ${selectedTags.length} selected tags`}
      </Button>
      {tags.map((tag) => (
        <TagComponent.default
          key={tag.id}
          label={tag.name}
          count={tag.message_count}
          selected={selectedTags.some((t) => t.id === tag.id)}
          onSelect={() =>
            handleTagSelectionChange(
              tag,
              !selectedTags.some((t) => t.id === tag.id),
            )
          }
        />
      ))}
    </div>
  );
});

TagFilter.displayName = 'TagFilter';

export default TagFilter;
