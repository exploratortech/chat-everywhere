import { IconTag } from '@tabler/icons-react';
import * as React from 'react';

import useTeacherOneTimeCodeTagsManagement from '@/hooks/useTeacherOneTimeCodeTagsManagement';

import { Tag } from '@/types/tags';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { cn } from '@/lib/utils';

const AddTagsToOneTimeCodeDropdown = React.memo(
  ({ tags, oneTimeCodeId }: { tags: Tag[]; oneTimeCodeId: string }) => {
    const [selectedTags, setSelectedTags] = React.useState<Tag[]>([]);

    const { getCodeTagsQuery, setCodeTagsMutation } =
      useTeacherOneTimeCodeTagsManagement(oneTimeCodeId || '');
    const { data: selectedTagIds } = getCodeTagsQuery;
    const { mutate: setCodeTags } = setCodeTagsMutation;
    React.useEffect(() => {
      if (selectedTagIds) {
        setSelectedTags(tags.filter((tag) => selectedTagIds.includes(tag.id)));
      }
    }, [selectedTagIds, tags]);

    const handleTagSelectionChange = (tag: Tag, checked: boolean) => {
      setSelectedTags((currentSelectedTags) => {
        if (checked) {
          setCodeTags([...currentSelectedTags, tag].map((t) => t.id));
          return [...currentSelectedTags, tag];
        } else {
          setCodeTags(
            currentSelectedTags.filter((t) => t.id !== tag.id).map((t) => t.id),
          );
          return currentSelectedTags.filter((t) => t.id !== tag.id);
        }
      });
    };

    return (
      <div className="flex flex-row gap-2">
        <div className="flex flex-rows items-center gap-2">
          {
            selectedTags.map((tag) => (
              <span key={tag.id} className="text-neutral-400 text-xs">
                {tag.name}
              </span>
            ))
          }
        </div>
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
      </div>
    );
  },
);

AddTagsToOneTimeCodeDropdown.displayName = 'AddTagsToOneTimeCodeDropdown ';

export default AddTagsToOneTimeCodeDropdown;
