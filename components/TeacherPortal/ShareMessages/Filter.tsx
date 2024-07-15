import { memo } from 'react';

import { ShareMessagesByTeacherProfilePayload } from '@/types/share-messages-by-teacher-profile';
import { Tag } from '@/types/tags';

import useShareMessageFilterStore from '@/components/TeacherPortal/share-message-filter.store';

import Export from './Export';
import ItemPerPage from './ItemPerPage';
import SortBy from './SortBy';
import TagFilter from './TagFilter';

const Filter = memo(
  ({
    tags,
    allSharedMessages,
    selectedMessageIds,
  }: {
    tags: Tag[];
    allSharedMessages:
      | ShareMessagesByTeacherProfilePayload['submissions']
      | null;
    selectedMessageIds: number[];
  }) => {
    const { selectedTags } = useShareMessageFilterStore();
    return (
      <div className="flex justify-between gap-4 items-start">
        <TagFilter tags={tags} />
        <div className="flex gap-4 items-center">
          <Export
            selectedTags={selectedTags}
            allSharedMessages={allSharedMessages}
            selectedMessageIds={selectedMessageIds}
          />
          <ItemPerPage />
          <SortBy />
        </div>
      </div>
    );
  },
);

Filter.displayName = 'Filter';

export default Filter;
