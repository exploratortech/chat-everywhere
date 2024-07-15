import { IconCircleCheck } from '@tabler/icons-react';
import React, { useContext, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { trackEvent } from '@/utils/app/eventTracking';
import { FeatureItem, PlanDetail } from '@/utils/app/ui';

import HomeContext from '@/components/home/home.context';

import { ReferralCodeEnter } from '../ReferralCodeEnter';
import { LineConnectionButton } from './LineConnectionButton';

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

  const upgradeLinkOnClick = () => {
    const paymentLink =
      process.env.NEXT_PUBLIC_ENV === 'production'
        ? 'https://buy.stripe.com/8wM8Av2DM0u99fWfZ1'
        : 'https://buy.stripe.com/test_4gw4hLcvq52Odt6fYY';
    const userEmail = user?.email;
    const userId = user?.id;

    trackEvent('Upgrade button clicked');

    if (!user) {
      toast.error('Please sign-up before upgrading to pro plan');
    } else {
      window.open(
        `${paymentLink}?prefilled_email=${userEmail}&client_reference_id=${userId}`,
        '_blank',
      );
    }
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
          <div className="mb-3 flex flex-col justify-center gap-4 md:flex-row">
            <div className="flex flex-col  rounded-lg border border-neutral-400 p-4 text-neutral-400 md:w-1/2">
              <span className="text-2xl font-bold">Free</span>
              <div className="text-xs leading-5">
                {PlanDetail.free.features.map((feature, index) => (
                  <FeatureItem key={index} featureName={t(feature)} />
                ))}
              </div>
            </div>
            <div className="mt-4 flex flex-col rounded-lg border p-4 md:ml-2 md:mt-0 md:w-1/2">
              {user?.plan === 'ultra' ? (
                <UltraPlanContent />
              ) : (
                <ProPlanContent />
              )}

              {(!user || !isPaidUser) && (
                <div className="flex flex-col">
                  <a
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => upgradeLinkOnClick()}
                    className="mt-4 cursor-pointer rounded-lg border border-none bg-white bg-gradient-to-r from-[#fd68a6] to-[#6c62f7] px-4 py-2 text-center text-sm font-semibold text-white shadow focus:outline-none"
                  >
                    {t('Upgrade')}
                  </a>
                  <p className="mt-2 text-xs text-neutral-400">
                    {t('No Strings Attached - Cancel Anytime!')}
                  </p>
                </div>
              )}

              {(user?.plan === 'pro' || user?.plan === 'ultra') &&
                user.proPlanExpirationDate && (
                  <div className="p-2 text-left text-xs text-neutral-500">
                    {`${t('Expires on')}: 
                            ${dayjs(user.proPlanExpirationDate).format(
                              'll',
                            )}`}{' '}
                  </div>
                )}
            </div>
          </div>
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

const ProPlanContent = () => {
  const { t } = useTranslation('model');
  return (
    <>
      <span className="text-2xl font-bold">Pro</span>
      <span className="mb-2 text-sm">{t('USD$9.99 / month')}</span>
      <div className="text-xs leading-5">
        <FeatureItem featureName={t('Everything in free plan')} />
        <FeatureItem featureName={t('Priority response time')} />
        {PlanDetail.pro.features.map((feature, index) => (
          <FeatureItem key={index} featureName={t(feature)} />
        ))}
      </div>
    </>
  );
};

const UltraPlanContent = () => {
  const { t } = useTranslation('model');
  return (
    <>
      <span
        className="rounded bg-gray-700 bg-gradient-to-r from-[#fd68a6] to-[#6c62f7] text-2xl font-medium text-indigo-400"
        style={{
          color: 'transparent',
          WebkitBackgroundClip: 'text',
          WebkitTextStrokeWidth: '1px',
          WebkitTextStrokeColor: 'transparent',
        }}
      >
        Ultra
      </span>
      <div className="text-xs leading-5">
        <FeatureItem featureName={t('Everything in free plan')} />
        <FeatureItem featureName={t('Priority response time')} />
        {PlanDetail.ultra.features.map((feature, index) => (
          <FeatureItem key={index} featureName={t(feature)} />
        ))}
      </div>
    </>
  );
};
