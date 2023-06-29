import { IconPlanet } from '@tabler/icons-react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import React, { useContext } from 'react';
import { useQuery } from 'react-query';

import { trackEvent } from '@/utils/app/eventTracking';

import { RefereeProfile } from '@/types/referral';

import HomeContext from '@/pages/api/home/home.context';

export default function ReferralProgramData() {
  const {
    state: { user },
    dispatch,
  } = useContext(HomeContext);

  const {
    data,
    isLoading,
    isSuccess,
    isError,
    error: queryError,
    refetch: getReferrals,
  } = useQuery(
    'referrals',
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
        throw new Error('Get referees failed, please contact your referrer');
      }

      const { referees } = (await response.json()) as {
        referees: RefereeProfile[];
      };
      return { referees };
    },
    {
      enabled: true,
      retry: false,
    },
  );
  return (
    <div className="text-center opacity-40 my-4 select-none">
      <h1 className="text-xl">Referral Data</h1>
      {isSuccess && <TheTable referees={data.referees ?? []} />}
    </div>
  );
}

const TheTable = ({ referees }: { referees: RefereeProfile[] }) => {
  const columnHelper = createColumnHelper<RefereeProfile>();
  // id: string;
  // plan: SubscriptionPlan;
  // stripe_subscription_id: string;
  // pro_plan_expiration_date: string | null;
  // referral_code: string | null;
  // referral_code_expiration_date: string | null;
  // email: string;
  // referral_date: string;

  const columns = [
    columnHelper.accessor('email', {
      header: 'Email',
      footer: (prop) => prop.column.id,
    }),
    columnHelper.accessor('plan', {
      header: 'Plan',
      footer: (prop) => prop.column.id,
    }),
    columnHelper.accessor('pro_plan_expiration_date', {
      header: 'Pro Plan Expiration Date',
      footer: (prop) => prop.column.id,
    }),
    columnHelper.accessor('referral_date', {
      header: 'Referral Date',
      footer: (prop) => prop.column.id,
    }),
  ];

  const table = useReactTable({
    data: referees,
    columns, // 輸入定義好的表頭
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table className="w-full my-10">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <th
                  key={header.id}
                  colSpan={header.colSpan}
                  {...{
                    onClick: header.column.getToggleSortingHandler(),
                  }}
                >
                  {header.isPlaceholder ? null : (
                    <div>
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
      <tbody className="">
        {table.getRowModel().rows.map((row, i) => (
          <tr className="" key={row.id}>
            {row.getVisibleCells().map((cell, i) => (
              <td data-rowIndex={i} key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
