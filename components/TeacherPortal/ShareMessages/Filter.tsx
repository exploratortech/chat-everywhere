import * as React from 'react';

import { Tag } from '@/types/tags';

import { Button } from '@/components/ui/button';

import useShareMessageFilterStore from '../share-message-filter.store';
import TagFilter from './TagFilter';

const Filter = React.memo(({ tags }: { tags: Tag[] }) => {
  const { selectedTags, resetTags } = useShareMessageFilterStore();
  return (
    <div className="flex items-baseline gap-2 ">
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
    </div>
  );
});

Filter.displayName = 'Filter';

export default Filter;
