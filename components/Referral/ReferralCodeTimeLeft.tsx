import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(duration);
dayjs.extend(isSameOrBefore);

const calculateTimeLeft = () => {
  const now = dayjs();
  const endOfDay = now.endOf('day');

  if (endOfDay.isSameOrBefore(now)) {
    return null;
  }

  const timeLeft = dayjs.duration(endOfDay.diff(now));
  const hours = timeLeft.hours();
  const minutes = timeLeft.minutes();
  const seconds = timeLeft.seconds();

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function ReferralCodeTimeLeft() {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const { t } = useTranslation('referral');

  useEffect(() => {
    const timer = setInterval(() => {
      const time = calculateTimeLeft();
      setTimeLeft(time);
      if (!time) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!timeLeft) {
    return (
      <div className="text-sm font-bold text-red-500">
        {t('Expired, please refresh page')}
      </div>
    );
  }
  return (
    <div className="text-sm text-neutral-500">
      {`${t('Expires in')} ${timeLeft}`}
    </div>
  );
}
