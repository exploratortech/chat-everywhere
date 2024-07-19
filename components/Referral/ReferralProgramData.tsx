import { useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { trackEvent } from '@/utils/app/eventTracking';

import type { RefereeProfile } from '@/types/referral';
import type { SubscriptionPlan } from '@/types/user';

import HomeContext from '@/components/home/home.context';

import dayjs from 'dayjs';

export default function ReferralProgramData() {
  const {
    state: { user },
  } = useContext(HomeContext);
  const [numberOfPaidUser, setNumberOfPaidUser] = useState(0);
  const { t } = useTranslation('model');

  const { data, isSuccess } = useQuery(
    ['referrals'],
    async () => {
      const response = await fetch('/api/referral/referees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user!.id,
        },
      });
      if (!response.ok) {
        trackEvent('get referees failed');
        throw new Error('Get referees failed, please contact administration');
      }

      const { referees, numberOfPaidUser } = (await response.json()) as {
        referees: RefereeProfile[];
        numberOfPaidUser: number;
      };
      setNumberOfPaidUser(numberOfPaidUser);
      const formattedReferees = referees.map((referee) => ({
        ...referee,
        plan: (referee.plan.charAt(0).toUpperCase() +
          referee.plan.slice(1)) as SubscriptionPlan,
        referralDate: dayjs(referee.referralDate).format('ll'),
        isInTrial: referee.isInTrial ? '✅' : '❌',
        hasPaidForPro: referee.hasPaidForPro ? '✅' : '❌',
      }));

      return { referees: formattedReferees };
    },
    {
      enabled: true,
      retry: false,
    },
  );
  return (
    <div className="my-4 select-none text-center">
      <h1 className="text-xl">{t('Referral Data')}</h1>
      {isSuccess && data.referees.length > 0 && (
        <>
          <div className="text-start">
            {`${t('Number of Paid user')}: ${numberOfPaidUser}`}
          </div>
          <RefereesTable referees={data.referees} />
        </>
      )}
      {isSuccess && data.referees.length === 0 && (
        <div className="my-10 text-neutral-500">No referees yet</div>
      )}
    </div>
  );
}

const RefereesTable = ({ referees }: { referees: RefereeProfile[] }) => {
  const columnHelper = createColumnHelper<RefereeProfile>();

  const { t } = useTranslation('model');
  const columns = [
    columnHelper.accessor('email', {
      header: `${t('Email')}`,
      footer: (prop) => prop.column.id,
    }),
    columnHelper.accessor('plan', {
      header: `${t('Plan')}`,
      footer: (prop) => prop.column.id,
    }),
    columnHelper.accessor('referralDate', {
      header: `${t('Referral Date')}`,
      footer: (prop) => prop.column.id,
    }),
    columnHelper.accessor('isInTrial', {
      header: `${t('Is in Trial')}`,
      footer: (prop) => prop.column.id,
    }),
    columnHelper.accessor('hasPaidForPro', {
      header: `${t('User has paid')}`,
      footer: (prop) => prop.column.id,
    }),
  ];

  const table = useReactTable({
    data: referees,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      <div className="mx-auto mb-6 w-[calc(100%-1.5rem)] overflow-x-scroll tablet:w-[calc(85dvw-1.5rem)]">
        <table className="my-10 w-full min-w-max ">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : (
                        <div className="bg-neutral-900 p-4">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {{
                            asc: '?',
                            desc: '?',
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, rIndex) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell, i) => (
                  <td data-rowIndex={i} key={cell.id}>
                    <div
                      className={`${
                        rIndex % 2 === 0 ? 'bg-neutral-800' : 'bg-neutral-700'
                      } p-2`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <div className="flex items-center justify-center gap-2">
          <button
            className="rounded border p-1"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {'<<'}
          </button>
          <button
            className="rounded border p-1"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {'<'}
          </button>
          <button
            className="rounded border p-1"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {'>'}
          </button>
          <button
            className="rounded border p-1"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {'>>'}
          </button>
          <span className="flex items-center gap-1">
            <div>Page</div>
            <strong>
              {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </strong>
          </span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="flex items-center gap-1">
            Go to page:
            <input
              type="number"
              defaultValue={table.getState().pagination.pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                table.setPageIndex(page);
              }}
              className="w-16 rounded border p-1 text-black"
            />
          </span>
          <select
            className="text-black "
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
