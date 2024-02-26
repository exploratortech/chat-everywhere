import * as React from 'react';

import { Tag } from '@/types/tags';

import TagFilter from './TagFilter';

const Filter = React.memo(({ tags }: { tags: Tag[] }) => {
  return (
    <div className="flex items-center gap-2">
      <TagFilter tags={tags} />
    </div>
  );
});

Filter.displayName = 'Filter';

export default Filter;
