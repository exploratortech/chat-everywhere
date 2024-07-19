import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { IconRefresh } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import React, { useContext, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useTranslation } from 'next-i18next';

import useTeacherPortalLoading from '@/hooks/teacherPortal/useTeacherPortalLoading';
import useTeacherTags from '@/hooks/teacherPortal/useTeacherTags';

import { trackEvent } from '@/utils/app/eventTracking';

import type { OneTimeCodeInfoPayload } from '@/types/one-time-code';
import type { Tag } from '@/types/tags';
import type { Tag as TagType } from '@/types/tags';

import HomeContext from '@/components/home/home.context';

import CodeTimeLeft from '../Referral/CodeTimeLeft';
import Spinner from '../Spinner/Spinner';
import HelpTagTooltip from './HelpTagTooltip';
import AddTagsToOneTimeCodeDropdown from './Tags/AddTagsToOneTimeCodeDropdown';
import TemporaryAccountProfileList from './TemporaryAccountProfileList';

import { cn } from '@/lib/utils';

const OneTimeCodeGeneration = () => {
  const { t } = useTranslation('model');
  const {
    state: { user },
  } = useContext(HomeContext);
  const isPeriodicFlag = useRef(false);
  const { fetchQuery } = useTeacherTags(isPeriodicFlag.current);
  const tags: TagType[] = fetchQuery.data || [];

  const [invalidateCode, setInvalidateCode] = useState(false);

  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const oneTimeCodeQuery = useGetOneTimeCode(
    invalidateCode,
    user?.id,
    selectedTags,
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(oneTimeCodeQuery.data?.code || '');
    toast.success(t('Copied to clipboard'));
  };

  const confirmAndRegenerateCode = () => {
    const userConfirmed = window.confirm(
      t('Are you sure you want to regenerate a new code?')!,
    );
    if (userConfirmed) {
      regenerateCode();
    }
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
        isPeriodicFlag.current = true;
        trackEvent('Teacher portal generate code');
      });
  };

  const isManuallyRegenerating =
    oneTimeCodeQuery.isRefetching && invalidateCode;
  return (
    <div>
      <h1 className="mb-4 font-bold">{t('One-time code')}</h1>
      {oneTimeCodeQuery.isLoading ? (
        <div className="mt-[50%] flex">
          <Spinner size="16px" className="mx-auto" />
        </div>
      ) : (
        <>
          {oneTimeCodeQuery.data?.code && (
            <div className="flex select-none flex-wrap items-center justify-between gap-2">
              <div onClick={handleCopy} className="shrink-0 cursor-pointer">
                {`${t('Your one-time code is')}: `}
                <span
                  className={cn(
                    'min-w-[60px] inline bg-sky-100 font-bold text-sm text-neutral-900 font-mono rounded dark:bg-neutral-600 dark:text-neutral-200 text-primary-500 p-1',
                    {
                      'animate-pulse': isManuallyRegenerating,
                    },
                  )}
                >
                  {isManuallyRegenerating
                    ? '******'
                    : oneTimeCodeQuery.data?.code}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AddTagsToOneTimeCodeDropdown
                  selectedTags={selectedTags}
                  setSelectedTags={setSelectedTags}
                  tags={tags}
                  oneTimeCodeId={oneTimeCodeQuery.data?.code_id}
                />
                <HelpTagTooltip />
                {isManuallyRegenerating ||
                oneTimeCodeQuery.isLoading ||
                !oneTimeCodeQuery.data?.expiresAt ? (
                  <Spinner size="16px" />
                ) : (
                  <CodeTimeLeft endOfDay={oneTimeCodeQuery.data.expiresAt} />
                )}
              </div>
            </div>
          )}
          <button
            className="mx-auto my-3 flex w-fit items-center gap-3 rounded border border-neutral-600 px-4 py-2 text-sm text-white hover:opacity-50 md:mb-0 md:mt-2"
            onClick={confirmAndRegenerateCode}
            disabled={isManuallyRegenerating}
          >
            {isManuallyRegenerating ? <Spinner size="16px" /> : <IconRefresh />}
            <div>{t('Regenerate code')}</div>
          </button>
          {oneTimeCodeQuery.data?.code && (
            <TemporaryAccountProfileList
              tempAccountProfiles={oneTimeCodeQuery.data.tempAccountProfiles}
              maxQuota={oneTimeCodeQuery.data.maxQuota}
              totalActiveTempAccount={
                oneTimeCodeQuery.data.totalActiveTempAccount
              }
            />
          )}
        </>
      )}
    </div>
  );
};

OneTimeCodeGeneration.displayName = 'OneTimeCodeGeneration';

export default OneTimeCodeGeneration;

export const useGetOneTimeCode = (
  invalidate: boolean,
  userId: string | undefined,
  selectedTags: Tag[] = [],
  isPeriodic: boolean = true,
) => {
  const supabase = useSupabaseClient();
  const { withLoading } = useTeacherPortalLoading();
  const fetchOneTimeCode = async () => {
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token;
    if (!accessToken) {
      return;
    }
    const response = await fetch(`/api/teacher-portal/get-code`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
        invalidate: invalidate ? 'true' : 'false',
        tag_ids_for_invalidate: selectedTags.map((tag) => tag.id).join(','),
      },
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return (await response.json()) as OneTimeCodeInfoPayload;
  };
  return useQuery(
    ['getOneTimeCode', { invalidate, userId, selectedTags }],
    () => {
      if (isPeriodic) {
        return fetchOneTimeCode();
      }
      return withLoading(fetchOneTimeCode);
    },
    {
      enabled: !!userId,
      refetchInterval: 3000, // 3 seconds
      refetchOnWindowFocus: true,
      keepPreviousData: true,
    },
  );
};
