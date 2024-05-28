import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import {
  OrderedSubscriptionPlans,
  ProPlanPaymentLink,
  UltraPlanPaymentLink,
} from '@/utils/app/const';
import { trackEvent } from '@/utils/app/eventTracking';
import { FeatureItem, PlanDetail } from '@/utils/app/ui';

import { User } from '@/types/user';

import dayjs from 'dayjs';

const PlanComparison = ({ user }: { user: User | null }) => {
  const { t } = useTranslation('model');

  const upgradeLinkOnClick = (upgradePlan: 'pro' | 'ultra') => {
    let paymentLink = '';
    if (upgradePlan === 'pro') {
      paymentLink = ProPlanPaymentLink;
    } else if (upgradePlan === 'ultra') {
      paymentLink = UltraPlanPaymentLink;
    }

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

  const showUpgradeToPro = useMemo(() => {
    if (!user) return true;
    const userPlanIndex = OrderedSubscriptionPlans.indexOf(user.plan);
    const proPlanIndex = OrderedSubscriptionPlans.indexOf('pro');
    return userPlanIndex < proPlanIndex;
  }, [user]);

  const showUpgradeToUltra = useMemo(() => {
    if (!user) return true;
    const userPlanIndex = OrderedSubscriptionPlans.indexOf(user.plan);
    const ultraPlanIndex = OrderedSubscriptionPlans.indexOf('ultra');
    return userPlanIndex < ultraPlanIndex;
  }, [user]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] justify-center gap-3 mb-3">
      {/* Free Plan */}
      <div className="flex flex-col w-full col-start-1 row-span-1 border rounded-lg p-4 text-neutral-400 border-neutral-400">
        <span className="text-2xl font-bold">Free</span>
        <div className="text-xs leading-5">
          {PlanDetail.free.features.map((feature, index) => (
            <FeatureItem key={index} featureName={t(feature)} />
          ))}
        </div>
      </div>

      {/* Pro Plan */}
      <div className="flex flex-col w-full col-start-1 row-span-1 border rounded-lg p-4">
        <ProPlanContent />

        {/* Upgrade button */}
        {showUpgradeToPro && (
          <div className="flex flex-col">
            <a
              target="_blank"
              rel="noreferrer"
              onClick={() => upgradeLinkOnClick('pro')}
              className="px-4 py-2 border rounded-lg bg-white shadow border-none text-white font-semibold focus:outline-none mt-4 text-center text-sm cursor-pointer bg-gradient-to-r from-[#fd68a6] to-[#6c62f7]"
            >
              {t('Upgrade')}
            </a>
            <p className="text-xs text-neutral-400 mt-2">
              {t('No Strings Attached - Cancel Anytime!')}
            </p>
          </div>
        )}

        {(user?.plan === 'pro' || user?.plan === 'ultra') &&
          user.proPlanExpirationDate && (
            <PlanExpirationDate expirationDate={user.proPlanExpirationDate} />
          )}
      </div>

      {/* Ultra Plan */}
      <div className="flex flex-col w-full col-start-1 row-start-auto md:row-start-1 md:col-start-2 row-span-2 border rounded-lg p-4">
        <UltraPlanContent />

        {/* Upgrade button */}
        {showUpgradeToUltra && (
          <div className="flex flex-col">
            <a
              target="_blank"
              rel="noreferrer"
              onClick={() => upgradeLinkOnClick('ultra')}
              className="px-4 py-2 border rounded-lg bg-white shadow border-none text-white font-semibold focus:outline-none mt-4 text-center text-sm cursor-pointer bg-gradient-to-r from-[#fd68a6] to-[#6c62f7]"
            >
              {t('Upgrade')}
            </a>
            <p className="text-xs text-neutral-400 mt-2">
              {t('No Strings Attached - Cancel Anytime!')}
            </p>
          </div>
        )}

        {(user?.plan === 'pro' || user?.plan === 'ultra') &&
          user.proPlanExpirationDate && (
            <PlanExpirationDate expirationDate={user.proPlanExpirationDate} />
          )}
      </div>
    </div>
  );
};

export default PlanComparison;

const PlanExpirationDate: React.FC<{ expirationDate: string }> = ({
  expirationDate,
}) => {
  console.log({
    expirationDate,
  });
  const { t } = useTranslation('model');
  return (
    <div className="text-left text-neutral-500 p-2 text-xs">
      {`${t('Expires on')}: ${dayjs(expirationDate).format('ll')}`}
    </div>
  );
};

const ProPlanContent = () => {
  const { t } = useTranslation('model');
  return (
    <>
      <span
        className="text-clip-transparent bg-gradient-pro py-0.5 mr-0 animate-background-gradient-slide bg-500% text-2xl font-bold rounded bg-gray-700"
        style={{
          color: 'transparent',
          WebkitBackgroundClip: 'text',
          WebkitTextStrokeWidth: '1px',
          WebkitTextStrokeColor: 'transparent',
        }}
      >
        Pro
      </span>
      <span className="text-sm mb-2">{t('USD$9.99 / month')}</span>
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
        className="text-clip-transparent bg-gradient-ultra py-0.5 mr-0 animate-background-gradient-slide bg-500% text-2xl font-bold rounded bg-gray-700"
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
