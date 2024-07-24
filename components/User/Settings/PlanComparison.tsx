import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useUserSubscriptionDetail } from '@/hooks/stripeSubscription/useUserSubscriptionDetail';

import {
  OrderedSubscriptionPlans,
  STRIPE_PAID_PLAN_LINKS,
} from '@/utils/app/const';
import { trackEvent } from '@/utils/app/eventTracking';
import { FeatureItem, PlanDetail } from '@/utils/app/ui';

import type { User, UserSubscriptionDetail } from '@/types/user';

import Spinner from '@/components/Spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import ChangeSubscriptionButton from './ChangeSubscriptionButton';

import dayjs from 'dayjs';

const PlanComparison = ({
  user,
  isPaidUser,
}: {
  user: User | null;
  isPaidUser: boolean;
}) => {
  const { data: userSubscriptionDetail, isFetched } = useUserSubscriptionDetail(
    {
      isPaidUser: isPaidUser,
      user,
    },
  );

  if (isPaidUser && !isFetched) {
    return (
      <div className="flex size-full min-h-52 items-center justify-center">
        <Spinner size="16px" />
      </div>
    );
  }
  return (
    <div className="mb-3 grid grid-cols-1 justify-center gap-3 md:grid-cols-[1fr_1fr]">
      {/* Free Plan */}
      <div className="col-start-1 row-span-1 flex w-full flex-col rounded-lg border border-neutral-400 p-4 text-neutral-300">
        <FreePlanContent user={user} />
      </div>

      {/* Pro Plan */}
      <div className="col-start-1 row-span-1 flex w-full flex-col rounded-lg border p-4">
        <ProPlanContent user={user} userSubscription={userSubscriptionDetail} />
      </div>

      {/* Ultra Plan */}
      <div className="col-start-1 row-span-2 row-start-auto flex w-full flex-col rounded-lg border p-4 md:col-start-2 md:row-start-1">
        <UltraPlanContent
          user={user}
          userSubscription={userSubscriptionDetail}
        />
      </div>
    </div>
  );
};

export default PlanComparison;

const PlanExpirationDate: React.FC<{ expirationDate: string }> = ({
  expirationDate,
}) => {
  const { t } = useTranslation('model');
  return (
    <div className="mt-4 flex grow items-end justify-center">
      <div className="p-2 text-left text-xs text-neutral-500">
        {`${t('Expires on')}: ${dayjs(expirationDate).format('ll')}`}
      </div>
    </div>
  );
};

const FreePlanContent = ({ user }: { user: User | null }) => {
  const { t } = useTranslation('model');
  return (
    <>
      <div className="flex flex-row items-center justify-between gap-2">
        <span className="py-0.5 text-2xl font-bold">Free</span>
        {(user?.plan === 'free' || !user) && <CurrentPlanTag />}
      </div>
      <div className="text-xs leading-5">
        {PlanDetail.free.features.map((feature, index) => (
          <FeatureItem key={index} featureName={t(feature)} />
        ))}
      </div>
    </>
  );
};
const ProPlanContent = ({
  user,
  userSubscription,
}: {
  user: User | null;
  userSubscription: UserSubscriptionDetail | undefined;
}) => {
  const { t, i18n } = useTranslation('model');
  const showUpgradeToPro = useMemo(() => {
    if (userSubscription) return false;
    if (!user) return true;
    const userPlanIndex = OrderedSubscriptionPlans.indexOf(user.plan);
    const proPlanIndex = OrderedSubscriptionPlans.indexOf('pro');
    return userPlanIndex < proPlanIndex;
  }, [user, userSubscription]);

  const upgradeLinkOnClick = () => {
    const paymentLink =
      i18n.language === 'zh-Hant' || i18n.language === 'zh'
        ? STRIPE_PAID_PLAN_LINKS['pro-monthly'].twd.link
        : STRIPE_PAID_PLAN_LINKS['pro-monthly'].usd.link;

    const userEmail = user?.email;
    const userId = user?.id;

    trackEvent('Upgrade button clicked');

    if (!user) {
      toast.error(t('Please sign-up before upgrading to paid plan'));
    } else {
      window.open(
        `${paymentLink}?prefilled_email=${userEmail}&client_reference_id=${userId}`,
        '_blank',
      );
    }
  };

  return (
    <>
      <div className="flex flex-row items-center justify-between gap-2">
        <span
          className="text-clip-transparent mr-0 animate-background-gradient-slide rounded bg-gray-700 bg-gradient-pro bg-500% py-0.5 text-2xl font-bold"
          style={{
            color: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextStrokeWidth: '1px',
            WebkitTextStrokeColor: 'transparent',
          }}
        >
          Pro
        </span>
        {user?.plan === 'pro' && <CurrentPlanTag />}
      </div>
      <ProPlanPrice userSubscription={userSubscription} />
      <div className="text-xs leading-5">
        <FeatureItem featureName={t('Everything in free plan')} />
        <FeatureItem featureName={t('Priority response time')} />
        {PlanDetail.pro.features.map((feature, index) => (
          <FeatureItem key={index} featureName={t(feature)} />
        ))}
      </div>
      {/* Upgrade button */}
      {showUpgradeToPro && (
        <div className="flex flex-col items-center">
          <a
            target="_blank"
            rel="noreferrer"
            onClick={upgradeLinkOnClick}
            className="mt-4 w-full cursor-pointer rounded-lg border border-none bg-white bg-gradient-to-r from-[#fd68a6] to-[#6c62f7] px-4 py-2 text-center text-sm font-semibold text-white shadow focus:outline-none"
          >
            {t('Upgrade')}
          </a>
          <p className="mt-2 text-xs text-neutral-400">
            {t('No Strings Attached - Cancel Anytime!')}
          </p>
        </div>
      )}

      <ChangeSubscriptionButton
        plan="pro"
        userSubscription={userSubscription}
      />

      {user?.plan === 'pro' && user.proPlanExpirationDate && (
        <PlanExpirationDate expirationDate={user.proPlanExpirationDate} />
      )}
    </>
  );
};

const UltraPlanContent = ({
  user,
  userSubscription,
}: {
  user: User | null;
  userSubscription: UserSubscriptionDetail | undefined;
}) => {
  const { t, i18n } = useTranslation('model');
  const [priceType, setPriceType] = useState<'monthly' | 'yearly'>('monthly');
  const showUpgradeToUltra = useMemo(() => {
    if (userSubscription) return false;
    if (!user) return true;
    const userPlanIndex = OrderedSubscriptionPlans.indexOf(user.plan);
    const ultraPlanIndex = OrderedSubscriptionPlans.indexOf('ultra');
    return userPlanIndex < ultraPlanIndex;
  }, [user, userSubscription]);

  const upgradeLinkOnClick = () => {
    let paymentLink = STRIPE_PAID_PLAN_LINKS['ultra-monthly'].usd.link;
    if (priceType === 'monthly') {
      if (i18n.language === 'zh-Hant' || i18n.language === 'zh') {
        paymentLink = STRIPE_PAID_PLAN_LINKS['ultra-monthly'].twd.link;
      } else {
        paymentLink = STRIPE_PAID_PLAN_LINKS['ultra-monthly'].usd.link;
      }
    } else {
      if (i18n.language === 'zh-Hant' || i18n.language === 'zh') {
        paymentLink = STRIPE_PAID_PLAN_LINKS['ultra-yearly'].twd.link;
      } else {
        paymentLink = STRIPE_PAID_PLAN_LINKS['ultra-yearly'].usd.link;
      }
    }

    const userEmail = user?.email;
    const userId = user?.id;

    trackEvent('Upgrade button clicked');

    if (!user) {
      toast.error(t('Please sign-up before upgrading to paid plan'));
    } else {
      window.open(
        `${paymentLink}?prefilled_email=${userEmail}&client_reference_id=${userId}`,
        '_blank',
      );
    }
  };

  return (
    <>
      <div className="flex flex-row items-center justify-between gap-2">
        <span
          className="text-clip-transparent mr-0 animate-background-gradient-slide rounded bg-gray-700 bg-gradient-ultra bg-500% py-0.5 text-2xl font-bold"
          style={{
            color: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextStrokeWidth: '1px',
            WebkitTextStrokeColor: 'transparent',
          }}
        >
          Ultra
        </span>
        {user?.plan === 'ultra' && <CurrentPlanTag />}
      </div>
      {user?.plan !== 'ultra' && (
        <UltraPlanPrice
          setPriceType={setPriceType}
          userSubscription={userSubscription}
        />
      )}

      <div className="text-xs leading-5">
        <FeatureItem featureName={t('Everything in free plan')} />
        <FeatureItem featureName={t('Priority response time')} />
        {PlanDetail.ultra.features.map((feature, index) => (
          <FeatureItem key={index} featureName={t(feature)} />
        ))}
      </div>
      {/* Upgrade button */}
      {showUpgradeToUltra && (
        <div className="flex flex-col items-center">
          <a
            target="_blank"
            rel="noreferrer"
            onClick={upgradeLinkOnClick}
            className="mt-4 w-full cursor-pointer rounded-lg border border-none bg-white bg-gradient-to-r from-[#fd68a6] to-[#6c62f7] px-4 py-2 text-center text-sm font-semibold text-white shadow focus:outline-none"
          >
            {t('Upgrade to Ultra')}
          </a>
          <p className="mt-2 text-xs text-neutral-400">
            {t('No Strings Attached - Cancel Anytime!')}
          </p>
        </div>
      )}
      <ChangeSubscriptionButton
        plan="ultra"
        userSubscription={userSubscription}
      />

      {user?.plan === 'ultra' && user.proPlanExpirationDate && (
        <PlanExpirationDate expirationDate={user.proPlanExpirationDate} />
      )}
    </>
  );
};

const CurrentPlanTag = () => {
  return (
    <span className="mr-2 size-max rounded bg-neutral-600  px-2 py-[.5px] text-[10px] font-medium text-neutral-400">
      CURRENT PLAN
    </span>
  );
};

const ProPlanPrice = ({
  userSubscription,
}: {
  userSubscription: UserSubscriptionDetail | undefined;
}) => {
  const { i18n } = useTranslation('model');

  if (userSubscription && userSubscription.subscriptionCurrency === 'twd') {
    return <span className="mb-2 text-sm">{'TWD$249.99 / month'}</span>;
  }
  if (userSubscription && userSubscription.subscriptionCurrency === 'usd') {
    return <span className="mb-2 text-sm">{'USD$9.99 / month'}</span>;
  }
  switch (i18n.language) {
    case 'zh-Hant':
    case 'zh':
      return <span className="mb-2 text-sm">{'TWD$249.99 / month'}</span>;
    default:
      return <span className="mb-2 text-sm">{'USD$9.99 / month'}</span>;
  }
};

const UltraPlanPrice = ({
  setPriceType,
  userSubscription,
}: {
  setPriceType: (type: 'monthly' | 'yearly') => void;
  userSubscription: UserSubscriptionDetail | undefined;
}) => {
  const { t, i18n } = useTranslation('model');

  const monthlyPriceComponent = useMemo(() => {
    if (userSubscription && userSubscription.subscriptionCurrency === 'twd') {
      return <span className="mb-2 text-sm">{'TWD$880 / month'}</span>;
    }

    if (userSubscription && userSubscription.subscriptionCurrency === 'usd') {
      return <span className="mb-2 text-sm">{'USD$29.99 / month'}</span>;
    }
    if (i18n.language === 'zh-Hant' || i18n.language === 'zh') {
      return <span className="mb-2 text-sm">{'TWD$880 / month'}</span>;
    } else {
      return <span className="mb-2 text-sm">{'USD$29.99 / month'}</span>;
    }
  }, [userSubscription, i18n.language]);

  const yearlyPriceComponent = useMemo(() => {
    if (userSubscription && userSubscription.subscriptionCurrency === 'twd') {
      return <span className="mb-2 text-sm">{'TWD$8800 / year'}</span>;
    }
    if (userSubscription && userSubscription.subscriptionCurrency === 'usd') {
      return <span className="mb-2 text-sm">{'USD$279.99 / year'}</span>;
    }

    if (i18n.language === 'zh-Hant' || i18n.language === 'zh') {
      return <span className="mb-2 text-sm">{'TWD$8800 / year'}</span>;
    } else {
      return <span className="mb-2 text-sm">{'USD$279.99 / year'}</span>;
    }
  }, [userSubscription, i18n.language]);

  return (
    <Tabs defaultValue="monthly" className="mb-4 mt-2 w-full">
      <TabsList className="w-full">
        <TabsTrigger
          value="monthly"
          className="w-full"
          onClick={() => {
            setPriceType('monthly');
          }}
        >
          {t('MONTHLY')}
        </TabsTrigger>
        <TabsTrigger
          value="yearly"
          className="w-full"
          onClick={() => {
            setPriceType('yearly');
          }}
        >
          {t('YEARLY')}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="monthly">{monthlyPriceComponent}</TabsContent>
      <TabsContent value="yearly">{yearlyPriceComponent}</TabsContent>
    </Tabs>
  );
};
