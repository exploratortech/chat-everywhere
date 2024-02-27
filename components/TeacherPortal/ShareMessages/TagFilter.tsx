import { IconTag } from '@tabler/icons-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Tag } from '@/types/tags';

import useShareMessageFilterStore from '@/components/TeacherPortal/share-message-filter.store';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { cn } from '@/lib/utils';

const TagFilter = React.memo(({ tags }: { tags: Tag[] }) => {
  const { t } = useTranslation('model');
  const { selectedTags, addTag, removeTag } = useShareMessageFilterStore();

  const handleTagSelectionChange = (tag: Tag, checked: boolean) => {
    if (checked) {
      addTag(tag); // Add tag
    } else {
      removeTag(tag.id); // Remove tag
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'max-w-max px-2',
            selectedTags.length > 0 ? 'bg-neutral-700' : '',
          )}
        >
          <div className="flex items-center gap-2">
            <IconTag className="w-4 h-4" />
            {t('Tags')}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="drop-shadow-2xl w-56 flex flex-col gap-4 p-4 border-0 shadow-lg bg-neutral-800"
      >
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center space-x-2">
            <Checkbox
              id={`dropdown-tag-${tag.id}`}
              checked={selectedTags.some((t) => t.id === tag.id)}
              onCheckedChange={(checked: boolean) => {
                handleTagSelectionChange(tag, checked);
              }}
            ></Checkbox>
            <label
              htmlFor={`dropdown-tag-${tag.id}`}
              className="cursor-pointer w-full text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {`${tag.name} ${
                tag.message_count ? `(${tag.message_count})` : ''
              }`}
            </label>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

TagFilter.displayName = 'TagFilter';

export default TagFilter;
