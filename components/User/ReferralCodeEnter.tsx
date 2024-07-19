import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useQuery } from '@tanstack/react-query';
import React, { useContext, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { trackEvent } from '@/utils/app/eventTracking';
import { userProfileQuery } from '@/utils/server/supabase';

import type { UserProfile } from '@/types/user';

import HomeContext from '@/components/home/home.context';

import { SettingsModelContext } from './Settings/SettingsModel';

export const ReferralCodeEnter = () => {
  const { t } = useTranslation('model');
  const [referralCode, setReferralCode] = useState('');
  const supabase = useSupabaseClient();

  const {
    state: { user },
    dispatch,
  } = useContext(HomeContext);

  const { closeModel } = useContext(SettingsModelContext);

  const {
    isFetching: isLoading,
    isError,
    error: queryError,
    refetch: queryReferralCodeRefetch,
  } = useQuery<{ profile: UserProfile }, Error>(
    ['redeemReferralCode'],
    async () => {
      if (user === null) throw new Error('User is not logged in');

      const response = await fetch('/api/referral/redeem-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id,
        },
        body: JSON.stringify({
          referralCode,
        }),
      });
      if (!response.ok) {
        trackEvent('Referral code redemption failed');
        if (response.status === 403) {
          throw new Error('User has already redeemed referral code before');
        }

        throw new Error(
          'Invalid or referral code has already expired, please contact your referrer',
        );
      }
      const profile = await userProfileQuery({
        client: supabase,
        userId: user.id,
      });
      return { profile };
    },
    {
      enabled: false,
      retry: false,
      onError: (error) => {
        console.error(error);
      },
      onSuccess: ({ profile }) => {
        dispatch({
          field: 'user',
          value: {
            ...user,
            plan: profile.plan,
            proPlanExpirationDate: profile.proPlanExpirationDate,
            hasReferrer: profile.hasReferrer,
            hasReferee: profile.hasReferee,
            isInReferralTrial: profile.isInReferralTrial,
          },
        });

        dispatch({
          field: 'isPaidUser',
          value: true,
        });

        toast.success(t('Referral code has been redeemed'));
        trackEvent('Referral code redemption success', {
          ReferralCode: referralCode,
        });
        closeModel();
      },
    },
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    trackEvent('Referral code redemption button clicked');
    if (referralCode) {
      queryReferralCodeRefetch();
    }
  };

  return (
    <div className="my-2 text-sm">
      <h2>{t('Referral code')}</h2>
      <form
        className="flex items-center justify-between gap-2"
        onSubmit={handleSubmit}
      >
        <input
          className="my-2 w-[70%] rounded-md border border-neutral-500 bg-transparent px-4 py-1 text-white shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
          placeholder={
            t('Please enter a referral code to start your trial') || ''
          }
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
        />
        <button
          type="submit"
          className="h-min w-fit rounded-md border bg-slate-200 px-4 py-[.23rem] text-black shadow  hover:bg-slate-300 focus:outline-none disabled:border-none disabled:bg-slate-400"
          disabled={!referralCode || isLoading}
        >
          {isLoading ? t('Loading...') : t('Submit')}
        </button>
      </form>
      {isError && (
        <div className="my-2 text-sm text-red-500">
          {t(queryError?.message)}
        </div>
      )}
    </div>
  );
};
