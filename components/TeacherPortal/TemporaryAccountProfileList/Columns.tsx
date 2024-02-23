import { CaretSortIcon } from '@radix-ui/react-icons';
import { ColumnDef } from '@tanstack/react-table';

import { TempAccountProfiles } from '@/types/one-time-code';

import CodeTimeLeft from '@/components/Referral/CodeTimeLeft';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

import dayjs from 'dayjs';

export const columns: ColumnDef<TempAccountProfiles>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'uniqueId',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="lowercase px-3">{row.getValue('uniqueId')}</div>
    ),
  },
  {
    accessorKey: 'code',
    header: 'Code',
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {`Created At`}
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="lowercase px-3">
        {dayjs(row.getValue('created_at')).format('YYYY-MM-DD HH:mm')}
      </div>
    ),
  },
  {
    accessorKey: 'expired_at',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {`Expired At`}
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="lowercase px-3">
        <CodeTimeLeft endOfDay={row.getValue('expired_at')} />
      </div>
    ),
  },
];
