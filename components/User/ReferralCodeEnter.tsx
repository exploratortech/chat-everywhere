import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { IconCircleCheck } from '@tabler/icons-react';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';

import { userProfileQuery } from '@/utils/server/supabase';

import { UserProfile } from '@/types/user';

import HomeContext from '@/pages/api/home/home.context';

export const ReferralCodeEnter = () => {
  const { t } = useTranslation('referral');
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
        throw new Error('Invalid Code');
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
      },
    },
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (referralCode) {
      queryReferralCodeRefetch();
    }
  };
  if (user?.hasReferrer) {
    return (
      <div className="text-xs leading-5 text-neutral-400 flex gap-2 mb-3 items-center">
        <IconCircleCheck className="text-green-500" size={19}/>
        <p className="flex items-center">
          {t(
            'You have already entered a referral code. Enjoy our pro plan experience!',
          )}
        </p>
      </div>
    );
  } else if (user?.plan === 'free') {
    return (
      <div className="my-4">
        <h2 className="">Referral Code</h2>
        <form className="flex items-center gap-2" onSubmit={handleSubmit}>
          <input
            className="w-full my-2 rounded-lg border border-neutral-500 px-4 py-1 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
            placeholder={
              t('Please enter a referral code to start your trial') || ''
            }
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-[.23rem] h-min border rounded-lg shadow text-black bg-slate-200 hover:bg-slate-300 focus:outline-none"
            disabled={!referralCode || isLoading}
          >
            {isLoading ? t('Loading...') : t('Enter')}
          </button>
        </form>
        {isError && (
          <div className="text-red-500 text-sm my-2">{queryError?.message}</div>
        )}
      </div>
    );
  } else {
    return null;
  }
};
