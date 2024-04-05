import { IconSortAscending } from '@tabler/icons-react';
import React, { memo } from 'react';

import { SortBy as SortByType } from '@/types/filter_sortby';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import useShareMessageFilterStore from '../share-message-filter.store';

import { cn } from '@/lib/utils';

const SortBy = memo(() => {
  const { sortBy, setSortBy, isNotSortByDefault, resetSortBy } =
    useShareMessageFilterStore();
  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="outline">
          <IconSortAscending />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between h-">
            <h1>Sort by</h1>

            <Button
              variant={'link'}
              className={cn(
                'text-neutral-500 hover:text-neutral-400',
                isNotSortByDefault() ? 'visible' : 'invisible',
              )}
              onClick={() => {
                resetSortBy();
                setSortBy({
                  sortKey: 'created_at',
                  sortOrder: 'desc',
                });
              }}
            >
              Reset
            </Button>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-2 grid-flow-row">
            <Select
              onValueChange={(value) => {
                setSortBy({
                  ...sortBy,
                  sortKey: value as SortByType['sortKey'],
                });
              }}
              defaultValue={sortBy.sortKey}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['created_at', 'student_name'].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              onValueChange={(value) => {
                setSortBy({
                  ...sortBy,
                  sortOrder: value as SortByType['sortOrder'],
                });
              }}
              defaultValue={sortBy.sortOrder}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['asc', 'desc'].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

SortBy.displayName = 'SortByFilterComponent';
export default SortBy;
