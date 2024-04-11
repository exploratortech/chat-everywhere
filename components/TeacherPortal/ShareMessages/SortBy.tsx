import { IconSortAscending } from '@tabler/icons-react';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

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

const SORT_BY_OPTIONS = [
  {
    label: 'Submitted at',
    value: 'created_at',
  },
  {
    label: 'Student name',
    value: 'student_name',
  },
];
const SortBy = memo(() => {
  const { sortBy, setSortBy, isNotSortByDefault, resetSortBy } =
    useShareMessageFilterStore();
  const { t } = useTranslation('model');
  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="outline" className="h-[30px]">
          <IconSortAscending />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="border-neutral-800">
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
                setSortBy({
                  sortKey: 'created_at',
                  sortOrder: 'desc',
                });
                resetSortBy();
              }}
            >
              Reset
            </Button>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-2 grid-flow-row">
            <Select
              value={sortBy.sortKey}
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
              <SelectContent className="border-neutral-800">
                {SORT_BY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sortBy.sortOrder}
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
              <SelectContent className="border-neutral-800">
                {['asc', 'desc'].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.toUpperCase()}
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
