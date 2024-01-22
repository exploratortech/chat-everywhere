import { IconCheckbox, IconCircleCheck } from '@tabler/icons-react';
import React, { useContext, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/app/cn';
import { trackEvent } from '@/utils/app/eventTracking';
import { PlanLevel } from '@/utils/app/planLevel';
import { FeatureItem, PlanDetail } from '@/utils/app/ui';

import HomeContext from '@/pages/api/home/home.context';

import { ReferralCodeEnter } from '../ReferralCodeEnter';
import { LineConnectionButton } from './LineConnectionButton';
import UpgradeButton from './UpgradeButton';

import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(LocalizedFormat);

export default function Settings_Account() {
  const { t } = useTranslation('model');
  const [displayReferralCodeEnterer, setDisplayReferralCodeEnterer] =
    useState(false);
  const {
    state: { user, subscriptionPlan },
    dispatch,
  } = useContext(HomeContext);

  const changePasswordOnClick = () => {
    dispatch({ field: 'showSettingsModel', value: false });
    dispatch({ field: 'showLoginSignUpModel', value: true });
  };

  const upgradeLinkOnClick = (plan: PlanLevel.Basic | PlanLevel.Pro) => {
    let paymentLink = '';
    switch (plan) {
      case PlanLevel.Basic:
        trackEvent(`Upgrade button clicked Basic plan}`);
        paymentLink =
          process.env.NEXT_PUBLIC_ENV === 'production'
            ? 'https://buy.stripe.com/fZe5ojemudgVak014t'
            : 'https://buy.stripe.com/test_00g29DgLGbrc60E3cl';
        break;
      case PlanLevel.Pro:
        trackEvent(`Upgrade button clicked Pro plan}`);
        paymentLink =
          process.env.NEXT_PUBLIC_ENV === 'production'
            ? 'https://buy.stripe.com/8wM8Av2DM0u99fWfZ1'
            : 'https://buy.stripe.com/test_4gw4hLcvq52Odt6fYY';
        break;
      default:
        break;
    }
    if (!paymentLink) return;

    const userEmail = user?.email;
    const userId = user?.id;

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

  return (
    <div>
      <h1 className="font-bold mb-4">{t('Account')}</h1>

      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl flex flex-col">
          {subscriptionPlan.planLevel <= PlanLevel.Basic && (
            <span className="text-sm mb-2">
              {t(
                'Unlock all the amazing features by upgrading to our Pro plan, cancel anytime!',
              )}
            </span>
          )}
          {subscriptionPlan.isPaidUser() && user?.isInReferralTrial && (
            <div className="text-xs leading-5 text-neutral-400 flex gap-2 mb-3 items-center">
              <IconCircleCheck className="text-green-500" size={19} />
              <p className="flex items-center">
                {t('Enjoy our pro plan experience during your trial!')}
              </p>
            </div>
          )}
          <div className="flex flex-col md:flex-row justify-center gap-4 mb-3">
            <div
              className={cn(
                'flex flex-col border rounded-lg p-4 text-neutral-400 border-neutral-400 md:w-1/2',
                {
                  'border-4': subscriptionPlan.planLevel === PlanLevel.Free,
                },
              )}
            >
              <FreePlanContent
                isSelectedPlan={subscriptionPlan.planLevel === PlanLevel.Free}
              />
            </div>

            <div
              className={cn(
                'flex flex-col border rounded-lg p-4 mt-4 md:mt-0 md:ml-2 md:w-1/2',
                {
                  'border-4': subscriptionPlan.planLevel === PlanLevel.Basic,
                },
              )}
            >
              <BasicPlanContent
                isSelectedPlan={subscriptionPlan.planLevel === PlanLevel.Basic}
              />

              {(!user || subscriptionPlan.planLevel < PlanLevel.Basic) && (
                <UpgradeButton
                  upgradeLinkOnClick={() => {
                    upgradeLinkOnClick(PlanLevel.Basic);
                  }}
                />
              )}

              {user?.plan === 'basic' && user.proPlanExpirationDate && (
                <div className="text-left text-neutral-500 p-2 text-xs">
                  {`${t('Expires on')}: 
                            ${dayjs(user.proPlanExpirationDate).format(
                              'll',
                            )}`}{' '}
                </div>
              )}
            </div>
            <div
              className={cn(
                'flex flex-col border rounded-lg p-4 mt-4 md:mt-0 md:ml-2 md:w-1/2',
                {
                  'border-4':
                    subscriptionPlan.planLevel === PlanLevel.Pro ||
                    subscriptionPlan.planLevel === PlanLevel.Ultra,
                },
              )}
            >
              {subscriptionPlan.planLevel === PlanLevel.Ultra ? (
                <UltraPlanContent
                  isSelectedPlan={
                    subscriptionPlan.planLevel === PlanLevel.Ultra
                  }
                />
              ) : (
                <ProPlanContent
                  isSelectedPlan={subscriptionPlan.planLevel === PlanLevel.Pro}
                />
              )}

              {(!user || subscriptionPlan.planLevel < PlanLevel.Basic) && (
                <UpgradeButton
                  upgradeLinkOnClick={() => {
                    upgradeLinkOnClick(PlanLevel.Pro);
                  }}
                />
              )}
              {(user || subscriptionPlan.planLevel === PlanLevel.Basic) && (
                <UpgradeButton
                  upgradeLinkOnClick={() => {
                    alert(
                      t(
                        `Please contact Jack at jack@exploratorlabs.com to upgrade to the Pro plan`,
                      ),
                    );
                  }}
                />
              )}

              {(user?.plan === 'pro' || user?.plan === 'ultra') &&
                user.proPlanExpirationDate && (
                  <div className="text-left text-neutral-500 p-2 text-xs">
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
            {subscriptionPlan.isPaidUser() && !user?.isInReferralTrial && (
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
              {!subscriptionPlan.isPaidUser() && (
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
        <LineConnectionButton />
      </div>
    </div>
  );
}

const FreePlanContent = ({ isSelectedPlan }: PlanContent) => {
  const { t } = useTranslation('model');
  return (
    <>
      <span className="text-2xl flex gap-2 items-center font-bold">
        Free
        {isSelectedPlan && <IconCheckbox />}
      </span>
      <div className="text-xs leading-5">
        {PlanDetail.free.features.map((feature, index) => (
          <FeatureItem key={index} featureName={t(feature)} />
        ))}
      </div>
    </>
  );
};
const BasicPlanContent = ({ isSelectedPlan }: PlanContent) => {
  const { t } = useTranslation('model');

  return (
    <>
      <span className="text-2xl flex gap-2 items-center font-bold">
        Basic
        {isSelectedPlan && <IconCheckbox />}
      </span>
      <span className="text-sm mb-2">{t('USD$4.99 / month')}</span>
      <div className="text-xs leading-5">
        <FeatureItem featureName={t('Everything in free plan')} />
        <FeatureItem featureName={t('Priority response time')} />
        {PlanDetail.basic.features.map((feature, index) => (
          <FeatureItem key={index} featureName={t(feature)} />
        ))}
      </div>
    </>
  );
};

const ProPlanContent = ({ isSelectedPlan }: PlanContent) => {
  const { t } = useTranslation('model');

  return (
    <>
      <span className="text-2xl flex gap-2 items-center font-bold">
        Pro
        {isSelectedPlan && <IconCheckbox />}
      </span>

      <span className="text-sm mb-2">{t('USD$9.99 / month')}</span>
      <div className="text-xs leading-5">
        <FeatureItem featureName={t('Everything in Basic plan')} />
        <FeatureItem featureName={t('Priority response time')} />
        {PlanDetail.pro.features.map((feature, index) => (
          <FeatureItem key={index} featureName={t(feature)} />
        ))}
      </div>
    </>
  );
};

const UltraPlanContent = ({ isSelectedPlan }: PlanContent) => {
  const { t } = useTranslation('model');
  return (
    <>
      <span
        className="text-2xl font-bold bg-gradient-to-r from-[#fd68a6] to-[#6c62f7] font-medium rounded bg-gray-700 text-indigo-400"
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

interface PlanContent {
  isSelectedPlan: boolean;
}
