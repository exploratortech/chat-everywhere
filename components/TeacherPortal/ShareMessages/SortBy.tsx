import { IconSortAscending } from '@tabler/icons-react';
import React, { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import useTeacherSettings from '@/hooks/teacherPortal/useTeacherSettings';

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
  const { updateSettingsMutation } = useTeacherSettings();
  const { mutate: updateSettings } = updateSettingsMutation;
  const { fetchSettingsQuery } = useTeacherSettings();
  const { data: settings } = fetchSettingsQuery;
  const { t } = useTranslation('model');

  const handleValueChange = (
    sortKey?: SortByType['sortKey'],
    sortOrder?: SortByType['sortOrder'],
  ) => {
    // Get the current sortBy state to fill in the missing value if only one is provided
    const currentSortBy = sortBy;
    // If a new sortKey or sortOrder is provided, use it; otherwise, fall back to the current state
    const newSortKey = sortKey ?? currentSortBy.sortKey;
    const newSortOrder = sortOrder ?? currentSortBy.sortOrder;
    // Update the local state
    setSortBy({ sortKey: newSortKey, sortOrder: newSortOrder });
    // Update the settings in the database. Only include the fields that are provided
    const updatePayload = {
      ...(sortKey !== undefined && { sort_key: newSortKey }),
      ...(sortOrder !== undefined && { sort_order: newSortOrder }),
    };
    updateSettings(updatePayload);
  };

  useEffect(() => {
    if (settings?.sort_key && settings?.sort_order) {
      setSortBy({
        sortKey: settings.sort_key as SortByType['sortKey'],
        sortOrder: settings.sort_order as SortByType['sortOrder'],
      });
    }
  }, [settings, setSortBy]);

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
                handleValueChange('created_at', 'desc');
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
                handleValueChange(value as SortByType['sortKey'], undefined);
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
                handleValueChange(undefined, value as SortByType['sortOrder']);
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
