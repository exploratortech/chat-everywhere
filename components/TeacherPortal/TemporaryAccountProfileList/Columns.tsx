import { CaretSortIcon } from '@radix-ui/react-icons';
import { ColumnDef } from '@tanstack/react-table';
import { TempAccountProfiles } from '@/types/one-time-code';

import CodeTimeLeft from '@/components/Referral/CodeTimeLeft';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

import { TFunction } from 'i18next';

import dayjs from 'dayjs';

export function getColumns(t: TFunction<'model', undefined>): ColumnDef<TempAccountProfiles>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t("Select all") || "Select all"}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t("Select row") || "Select row"}
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
            {t("Name")}
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="lowercase pl-5">{row.getValue('uniqueId')}</div>
      ),
    },
    {
      accessorKey: 'code',
      header: t("Code") || "Code",
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {t("Registered At")}
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="lowercase pl-4">
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
            {t("Expired At")}
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="lowercase pl-4">
          <CodeTimeLeft endOfDay={row.getValue('expired_at')} timeOnly={true}/>
        </div>
      ),
    },
  ];
}
