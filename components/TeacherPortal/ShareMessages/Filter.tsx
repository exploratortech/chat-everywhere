import { memo } from 'react';

import { Tag } from '@/types/tags';

import { Button } from '@/components/ui/button';

import useShareMessageFilterStore from '../share-message-filter.store';
import SortBy from './SortBy';
import TagFilter from './TagFilter';

const Filter = memo(({ tags }: { tags: Tag[] }) => {
  const { selectedTags, resetTags } = useShareMessageFilterStore();
  return (
    <div className="flex justify-between gap-2 items-center">
      <TagFilter tags={tags} />
      {selectedTags.length > 0 && (
        <Button
          variant={'link'}
          onClick={() => resetTags()}
          className="text-neutral-500 hover:text-neutral-400"
        >
          {`Clear ${selectedTags.length} selected tags`}
        </Button>
      )}
      <SortBy />
    </div>
  );
});

Filter.displayName = 'Filter';

export default Filter;
