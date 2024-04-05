import { IconSortAscending } from '@tabler/icons-react';

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
import { SortBy } from '@/types/filter_sortby';
import useShareMessageFilterStore from '../share-message-filter.store';


const SortBy = () => {
  const { sortBy, setSortBy } = useShareMessageFilterStore();
  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="outline">
          <IconSortAscending />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col gap-2">
          <h1>Sort by</h1>
          <Separator />
          <div className="grid grid-cols-2 gap-2 grid-flow-row">
            <Select
              onValueChange={(value) => {
                setSortBy({
                  ...sortBy,
                  sortKey: value as 'created_at' | 'name',
                });
              }}
              defaultValue={sortBy.sortKey}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['created_at', 'name'].map((option) => (
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
                  sortOrder: value as 'asc' | 'desc',
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
};

export default SortBy;
