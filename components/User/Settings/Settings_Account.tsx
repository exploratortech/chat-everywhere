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
      <h1 className="font-bold mb-4">{t('Account')}</h1>

      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl flex flex-col">
          {!isPaidUser && (
            <span className="text-sm mb-2">
              {t(
                'Unlock all the amazing features by upgrading to our Pro plan, cancel anytime!',
              )}
            </span>
          )}
          {isPaidUser && user?.isInReferralTrial && (
            <div className="text-xs leading-5 text-neutral-400 flex gap-2 mb-3 items-center">
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
                  className="underline cursor-pointer"
                >
                  {t('here')}
                </a>
                {t(' and cancel your subscription.')}
              </p>
            )}

            <p className="text-xs text-neutral-400 mt-2">
              {t('If you have any questions, please contact us at ')}
              <a
                target="_blank"
                rel="noreferrer"
                className="underline cursor-pointer"
                href="mailto:jack@exploratorlabs.com"
              >
                jack@exploratorlabs.com
              </a>
            </p>
            {user && (
              <p className="text-xs text-neutral-400 mt-2">
                {t('Your registration email is')} {user?.email}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-4">
          {user && (
            <div className="flex flex-row items-center">
              {!isPaidUser && (
                <span
                  className="pr-2 text-neutral-500 hover:text-neutral-700 focus:outline-none cursor-pointer text-xs"
                  onClick={() =>
                    setDisplayReferralCodeEnterer(!displayReferralCodeEnterer)
                  }
                >
                  {t('Referral code')}
                </span>
              )}

              <span
                className="px-4 text-neutral-500 hover:text-neutral-700 focus:outline-none cursor-pointer mr-2 text-xs"
                onClick={changePasswordOnClick}
              >
                {t('Change password')}
              </span>
            </div>
          )}
        </div>
        <div className="inline-flex items-center justify-center w-full">
          <hr className="w-64 h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />
          <span className="absolute px-3 text-white -translate-x-1/2 left-1/2 bg-[#171717]">
            {t('Integrations (pro plan)')}
          </span>
        </div>
        {lineButtonDisplayCondition && <LineConnectionButton />}
      </div>
    </div>
  );
}
