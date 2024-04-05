import { memo } from 'react';

import { Tag } from '@/types/tags';

import SortBy from './SortBy';
import TagFilter from './TagFilter';

const Filter = memo(({ tags }: { tags: Tag[] }) => {
  return (
    <div className="flex justify-between gap-4 items-start">
      <TagFilter tags={tags} />
      <SortBy />
    </div>
  );
});

Filter.displayName = 'Filter';

export default Filter;
