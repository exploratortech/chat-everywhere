import { IconCircleCheck } from '@tabler/icons-react';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

import HomeContext from '@/components/home/home.context';

import { ReferralCodeEnter } from '../ReferralCodeEnter';
import { LineConnectionButton } from './LineConnectionButton';
import PlanComparison from './PlanComparison';

import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(LocalizedFormat);

export default function Settings_Account() {
  const { t } = useTranslation('model');
  const [displayReferralCodeEnterer, setDisplayReferralCodeEnterer] =
    useState(false);
  const {
    state: { user, isTempUser, isPaidUser, teacherSettings },
    dispatch,
  } = useContext(HomeContext);

  const changePasswordOnClick = () => {
    dispatch({ field: 'showSettingsModel', value: false });
    dispatch({ field: 'showLoginSignUpModel', value: true });
  };

  const subscriptionManagementLink = () =>
    process.env.NEXT_PUBLIC_ENV === 'production'
      ? 'https://billing.stripe.com/p/login/5kAbMj0wt5VF6AwaEE'
      : 'https://billing.stripe.com/p/login/test_28o4jFe6GaqK1UY5kk';

  const isStudentAccount = isTempUser;
  const lineButtonDisplayCondition =
    !isStudentAccount ||
    (isStudentAccount && teacherSettings.allow_student_use_line);

  return (
    <div>
      <h1 className="mb-4 font-bold">{t('Account')}</h1>

      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col rounded-2xl">
          {!isPaidUser && (
            <span className="mb-2 text-sm">
              {t(
                'Unlock all the amazing features by upgrading to our Pro plan, cancel anytime!',
              )}
            </span>
          )}
          {isPaidUser && user?.isInReferralTrial && (
            <div className="mb-3 flex items-center gap-2 text-xs leading-5 text-neutral-400">
              <IconCircleCheck className="text-green-500" size={19} />
              <p className="flex items-center">
                {t('Enjoy our pro plan experience during your trial!')}
              </p>
            </div>
          )}
          {<PlanComparison user={user} isPaidUser={isPaidUser} />}

          {displayReferralCodeEnterer && <ReferralCodeEnter />}
          <div>
            {isPaidUser && !user?.isInReferralTrial && (
              <p className="text-xs text-neutral-400">
                {t(
                  'Thank you for supporting us! If you want to cancel your subscription, please visit ',
                )}
                <a
                  href={subscriptionManagementLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="cursor-pointer underline"
                >
                  {t('here')}
                </a>
                {t(' and cancel your subscription.')}
              </p>
            )}

            <p className="mt-2 text-xs text-neutral-400">
              {t('If you have any questions, please contact us at ')}
              <a
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer underline"
                href="mailto:jack@exploratorlabs.com"
              >
                jack@exploratorlabs.com
              </a>
            </p>
            {user && (
              <p className="mt-2 text-xs text-neutral-400">
                {t('Your registration email is')} {user?.email}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          {user && (
            <div className="flex flex-row items-center">
              {!isPaidUser && (
                <span
                  className="cursor-pointer pr-2 text-xs text-neutral-500 hover:text-neutral-700 focus:outline-none"
                  onClick={() =>
                    setDisplayReferralCodeEnterer(!displayReferralCodeEnterer)
                  }
                >
                  {t('Referral code')}
                </span>
              )}

              <span
                className="mr-2 cursor-pointer px-4 text-xs text-neutral-500 hover:text-neutral-700 focus:outline-none"
                onClick={changePasswordOnClick}
              >
                {t('Change password')}
              </span>
            </div>
          )}
        </div>
        <div className="inline-flex w-full items-center justify-center">
          <hr className="my-8 h-px w-64 border-0 bg-gray-200 dark:bg-gray-700" />
          <span className="absolute left-1/2 -translate-x-1/2 bg-[#171717] px-3 text-white">
            {t('Integrations (pro plan)')}
          </span>
        </div>
        {lineButtonDisplayCondition && <LineConnectionButton />}
      </div>
    </div>
  );
}
