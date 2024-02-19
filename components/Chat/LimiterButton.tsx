import React, { useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from 'react-tooltip';

import HomeContext from '@/components/home/home.context';

import CircularProgress from './CircularProgress';

interface LimiterButtonProps {
  intervalRemaining: number;
  maxInterval: number;
}

export default function LimiterButton({
  intervalRemaining,
  maxInterval,
}: LimiterButtonProps) {
  const { t } = useTranslation('chat');
  const {
    state: { user },
  } = useContext(HomeContext);

  const limiterToolTip = useMemo(() => {
    const isFreeUser = user && user.plan === 'free';
    if (isFreeUser) {
      return t('Upgrade to remove wait time') || '';
    }
    return (
      t('Please sign in to reduce wait time, or upgrade to remove it') || ''
    );
  }, [t]);
  return (
    <>
      <button
        id="limiter-tooltip"
        className="absolute top-0 right-0 rounded-sm p-1 text-neutral-800 opacity-60 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
        onClick={() => {}}
      >
        <CircularProgress
          milliseconds={intervalRemaining}
          maxMilliseconds={maxInterval}
        ></CircularProgress>
      </button>
      <Tooltip
        style={{ zIndex: 99 }}
        anchorSelect="#limiter-tooltip"
        content={limiterToolTip}
      />
    </>
  );
}
