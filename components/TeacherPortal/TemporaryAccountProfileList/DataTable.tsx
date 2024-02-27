import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { TempAccountProfiles } from '@/types/one-time-code';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DataTableProps<TData extends TempAccountProfiles, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  handleRemoveAccounts: (ids: number[]) => void;
}

export function DataTable<TData extends TempAccountProfiles, TValue>({
  columns,
  data,
  handleRemoveAccounts,
}: DataTableProps<TempAccountProfiles, any>) {
  const { t } = useTranslation('model');

  const table = useReactTable<TempAccountProfiles>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <>
      <div className="rounded-md border border-gray-600">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-gray-600">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="border-gray-600"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t('No results')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex my-4 items-center">
        <div className="">
          <Button
            onClick={() =>
              handleRemoveAccounts(
                table
                  .getFilteredSelectedRowModel()
                  .rows.map((row) => row.original.id),
              )
            }
            variant="destructive"
            disabled={table.getFilteredSelectedRowModel().rows.length === 0}
          >
            {t('Remove')}{' '}
            {table.getFilteredSelectedRowModel().rows.length !== 0 &&
              `(${table.getFilteredSelectedRowModel().rows.length})`}
          </Button>
        </div>
      </div>
    </>
  );
}

export default DataTable;
