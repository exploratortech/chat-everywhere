import { IconRefresh } from '@tabler/icons-react';
import React, { memo, useContext, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useQuery } from 'react-query';

import { useTranslation } from 'next-i18next';

import { trackEvent } from '@/utils/app/eventTracking';

import { OneTimeCodeInfoPayload } from '@/types/one-time-code';

import HomeContext from '@/components/home/home.context';

import CodeTimeLeft from '../Referral/CodeTimeLeft';
import Spinner from '../Spinner/Spinner';
import TemporaryAccountProfileList from './TemporaryAccountProfileList';

const OneTimeCodeGeneration = memo(() => {
  const { t } = useTranslation('model');
  const {
    state: { user },
  } = useContext(HomeContext);

  const [invalidateCode, setInvalidateCode] = useState(false);

  const oneTimeCodeQuery = useGetOneTimeCode(invalidateCode, user?.id);

  const handleCopy = () => {
    navigator.clipboard.writeText(oneTimeCodeQuery.data?.code || '');
    toast.success(t('Copied to clipboard'));
  };

  // Trigger code invalidation and refetch
  const regenerateCode = () => {
    setInvalidateCode(true);
    oneTimeCodeQuery
      .refetch()
      .then(() => {
        toast.success(t('Code regenerated'));
      })
      .catch(() => {
        toast.error(t('Failed to regenerate code'));
      })
      .finally(() => {
        setInvalidateCode(false);
        trackEvent('Teacher portal generate code');
      });
  };

  return (
    <div className="">
      <h1 className="text-lg font-bold mb-4">{t('One-time code')}</h1>
      {oneTimeCodeQuery.isLoading && (
        <div className="flex mt-[50%]">
          <Spinner size="16px" className="mx-auto" />
        </div>
      )}
      {!oneTimeCodeQuery.isLoading && oneTimeCodeQuery.data?.code && (
        <div className="flex select-none justify-between items-center flex-wrap gap-2">
          <div onClick={handleCopy} className="cursor-pointer flex-shrink-0">
            {`${t('Your one-time code is')}: `}
            <span className="inline bg-sky-100 font-bold text-sm text-slate-900 font-mono rounded dark:bg-slate-600 dark:text-slate-200 text-primary-500 p-1">
              {oneTimeCodeQuery.data?.code}
            </span>
          </div>
          {oneTimeCodeQuery.data?.expiresAt && (
            <CodeTimeLeft endOfDay={oneTimeCodeQuery.data.expiresAt} />
          )}
        </div>
      )}
      <button
        className="mx-auto my-3 flex w-fit items-center gap-3 rounded border text-sm py-2 px-4 hover:opacity-50 border-neutral-600 text-white md:mb-0 md:mt-2"
        onClick={regenerateCode}
        disabled={oneTimeCodeQuery.isLoading}
      >
        {oneTimeCodeQuery.isLoading ? <Spinner size="16px" /> : <IconRefresh />}
        <div>{t('Regenerate code')}</div>
      </button>
      {!oneTimeCodeQuery.isLoading && oneTimeCodeQuery.data?.code && (
        <TemporaryAccountProfileList
          tempAccountProfiles={oneTimeCodeQuery.data.tempAccountProfiles}
          maxQuota={oneTimeCodeQuery.data.maxQuota}
          totalActiveTempAccount={oneTimeCodeQuery.data.totalActiveTempAccount}
        />
      )}
    </div>
  );
});

OneTimeCodeGeneration.displayName = 'OneTimeCodeGeneration';

export default OneTimeCodeGeneration;

export const useGetOneTimeCode = (
  invalidate: boolean,
  userId: string | undefined,
) => {
  return useQuery(
    ['getOneTimeCode', { invalidate, userId }],
    async () => {
      const response = await fetch(`/api/teacher-portal/get-code`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId || '',
          invalidate: invalidate ? 'true' : 'false',
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      return (await response.json()) as OneTimeCodeInfoPayload;
    },
    {
      enabled: !!userId,
      refetchInterval: 3000, // 3 seconds
      refetchOnWindowFocus: true,
    },
  );
};
