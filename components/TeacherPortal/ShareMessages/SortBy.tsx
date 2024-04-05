import { IconSortAscending } from '@tabler/icons-react';
import { useState } from 'react';

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

interface SortBy {
  sortKey: 'created_at' | 'name';
  sortOrder: 'asc' | 'desc';
}
const SortBy = () => {
  const [sortBy, setSortBy] = useState<SortBy>({
    sortKey: 'created_at',
    sortOrder: 'desc',
  });
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
                setSortBy((prevSortBy) => ({
                  ...prevSortBy,
                  sortKey: value as 'created_at' | 'name',
                }));
              }}
              defaultValue={sortBy.sortKey}
            >
              <SelectTrigger className="">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#40414F]">
                {['created_at', 'name'].map((option) => (
                  <SelectItem key={option} value={option} className="">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              onValueChange={(value) => {
                setSortBy((prevSortBy) => ({
                  ...prevSortBy,
                  sortOrder: value as 'asc' | 'desc',
                }));
              }}
              defaultValue={sortBy.sortOrder}
            >
              <SelectTrigger className="">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#40414F]">
                {['asc', 'desc'].map((option) => (
                  <SelectItem key={option} value={option} className="">
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
