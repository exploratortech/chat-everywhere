import { DropdownMenuCheckboxItemProps } from '@radix-ui/react-dropdown-menu';
import { IconTag } from '@tabler/icons-react';
import * as React from 'react';

import { Tag } from '@/types/tags';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { cn } from '@/lib/utils';

const AddTagsDropdown = ({ tags }: { tags: Tag[] }) => {
  const [selectedTags, setSelectedTags] = React.useState<Tag[]>([]);

  const handleTagSelectionChange = (tag: Tag, checked: boolean) => {
    setSelectedTags((currentSelectedTags) => {
      if (checked) {
        return [...currentSelectedTags, tag];
      } else {
        return currentSelectedTags.filter((t) => t.id !== tag.id);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={'icon'}
          className={cn(
            '!ring-0',
            selectedTags.length > 0 ? 'bg-neutral-700' : '',
          )}
        >
          <IconTag className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 flex flex-col gap-4 p-4 border-0 shadow-lg bg-neutral-800">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center space-x-2">
            <Checkbox
              id={`dropdown-tag-${tag.id}`}
              checked={selectedTags.some((t) => t.id === tag.id)}
              onCheckedChange={(checked: boolean) => {
                handleTagSelectionChange(tag, checked);
              }}
            >
              {tag.name}
            </Checkbox>
            <label
              htmlFor={`dropdown-tag-${tag.id}`}
              className="cursor-pointer w-full text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {tag.name}
            </label>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddTagsDropdown;
