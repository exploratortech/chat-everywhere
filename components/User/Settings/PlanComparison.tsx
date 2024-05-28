import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import {
  OrderedSubscriptionPlans,
  PRO_PLAN_PAYMENT_LINK,
  ULTRA_PLAN_PAYMENT_LINK,
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
      paymentLink = PRO_PLAN_PAYMENT_LINK;
    } else if (upgradePlan === 'ultra') {
      paymentLink = ULTRA_PLAN_PAYMENT_LINK;
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
      <div className="flex flex-col w-full col-start-1 row-span-1 border rounded-lg p-4 text-neutral-3000 border-neutral-400">
        <FreePlanContent user={user} />
      </div>

      {/* Pro Plan */}
      <div className="flex flex-col w-full col-start-1 row-span-1 border rounded-lg p-4">
        <ProPlanContent user={user} />

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
        <UltraPlanContent user={user} />

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

const FreePlanContent = ({ user }: { user: User | null }) => {
  const { t } = useTranslation('model');
  return (
    <>
      <div className="flex flex-row items-center justify-between gap-2">
        <span className="text-2xl py-0.5 font-bold">Free</span>
        {(user?.plan === 'free' || !user) && <CurrentTag />}
      </div>
      <div className="text-xs leading-5">
        {PlanDetail.free.features.map((feature, index) => (
          <FeatureItem key={index} featureName={t(feature)} />
        ))}
      </div>
    </>
  );
};
const ProPlanContent = ({ user }: { user: User | null }) => {
  const { t } = useTranslation('model');
  return (
    <>
      <div className="flex flex-row items-center justify-between gap-2">
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
        {user?.plan === 'pro' && <CurrentTag />}
      </div>
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

const UltraPlanContent = ({ user }: { user: User | null }) => {
  const { t } = useTranslation('model');
  return (
    <>
      <div className="flex flex-row items-center justify-between gap-2">
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
        {user?.plan === 'ultra' && <CurrentTag />}
      </div>
      <span className="text-sm mb-2">{t('USD$19.99 / month')}</span>

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

const CurrentTag = () => {
  return (
    <span className="h-max bg-neutral-600 text-neutral-400 text-[10px]  font-medium mr-2 px-2 py-[.5px] rounded w-max">
      CURRENT PLAN
    </span>
  );
};
