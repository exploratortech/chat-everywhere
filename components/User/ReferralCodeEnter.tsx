import { useSupabaseClient } from '@supabase/auth-helpers-react';
import React, { useContext, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';

import { trackEvent } from '@/utils/app/eventTracking';
import { userProfileQuery } from '@/utils/server/supabase';

import { UserProfile } from '@/types/user';

import HomeContext from '@/pages/api/home/home.context';

export const ReferralCodeEnter = () => {
  const { t } = useTranslation('model');
  const [referralCode, setReferralCode] = useState('');
  const supabase = useSupabaseClient();

  const {
    state: { user },
    dispatch,
  } = useContext(HomeContext);

  const {
    isLoading,
    isError,
    error: queryError,
    refetch: queryReferralCodeRefetch,
  } = useQuery<{ profile: UserProfile }, Error>(
    'redeemReferralCode',
    async () => {
      const response = await fetch('/api/referral/redeem-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user!.id,
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
      const profile = await userProfileQuery(supabase, user!.id);
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
          },
        });
        dispatch({
          field: 'showProfileModel',
          value: false,
        });
        dispatch({
          field: 'isPaidUser',
          value: true,
        });
        toast.success(t('Referral code has been redeemed'));
        trackEvent('Referral code redemption success', {
          ReferralCode: referralCode,
        });
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
      <h2 className="">{t('Referral code')}</h2>
      <form
        className="flex items-center gap-2 justify-between"
        onSubmit={handleSubmit}
      >
        <input
          className="w-[70%] my-2 rounded-md border border-neutral-500 px-4 py-1 text-white shadow focus:outline-none bg-transparent dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
          placeholder={
            t('Please enter a referral code to start your trial') || ''
          }
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
        />
        <button
          type="submit"
          className="px-4 py-[.23rem] h-min border rounded-md shadow text-black disabled:bg-slate-400 disabled:border-none  bg-slate-200 hover:bg-slate-300 focus:outline-none w-fit"
          disabled={!referralCode || isLoading}
        >
          {isLoading ? t('Loading...') : t('Submit')}
        </button>
      </form>
      {isError && (
        <div className="text-red-500 text-sm my-2">
          {t(queryError?.message)}
        </div>
      )}
    </div>
  );
};
