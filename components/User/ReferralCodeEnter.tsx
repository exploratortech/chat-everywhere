import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import HomeContext from '@/pages/api/home/home.context';

export const ReferralCodeEnter = () => {
  const { t } = useTranslation('referral');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');

  const {
    state: { user },
    dispatch,
  } = useContext(HomeContext);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await submitCode({
        referralCode,
        userId: user!.id,
      });
      dispatch({
        field: 'user',
        value: {
          ...user,
          plan: 'pro',
        },
      });
    } catch (error) {
      setError((error as Error).message);
    }
  };
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
          disabled={!referralCode}
        >
          {t('Enter')}
        </button>
      </form>
      {error && <div className="text-red-500 text-sm my-2">{error}</div>}
    </div>
  );
};

async function submitCode({
  referralCode,
  userId,
}: {
  referralCode: string;
  userId: string;
}) {
  try {
    const body = JSON.stringify({
      referralCode,
    });

    const response = await fetch('/api/referral/redeem-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-id': userId,
      },
      body,
    });
    if (!response.ok) {
      throw new Error('Invalid Code');
    }
  } catch (error) {
    throw new Error('Invalid Code');
  }
}
