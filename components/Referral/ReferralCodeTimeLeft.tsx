import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { en } from '@supabase/auth-ui-shared';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(duration);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

const calculateTimeLeft = (endOfDayInput: string) => {
  const now = dayjs().utc();
  const endOfDay = dayjs(endOfDayInput).utc();

  if (endOfDay.isSameOrBefore(now)) {
    return null;
  }

  const timeLeft = dayjs.duration(endOfDay.diff(now));
  const hours = timeLeft.hours() + timeLeft.days() * 24;
  const minutes = timeLeft.minutes();
  const seconds = timeLeft.seconds();

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function ReferralCodeTimeLeft({
  endOfDay,
}: {
  endOfDay: string;
}) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(endOfDay));
  const { t } = useTranslation('model');

  useEffect(() => {
    const timer = setInterval(() => {
      const time = calculateTimeLeft(endOfDay);
      setTimeLeft(time);
      if (!time) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endOfDay]);

  if (!timeLeft) {
    return <div className="text-sm font-bold text-red-500">{t('Expired')}</div>;
  }
  return (
    <div className="text-sm text-neutral-500">
      {`${t('Expires in')} ${timeLeft}`}
    </div>
  );
}
