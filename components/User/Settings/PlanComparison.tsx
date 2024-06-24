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

import { User, UserSubscriptionDetail } from '@/types/user';

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
      <div className="w-full h-full min-h-52 flex items-center justify-center">
        <Spinner size="16px" />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] justify-center gap-3 mb-3">
      {/* Free Plan */}
      <div className="flex flex-col w-full col-start-1 row-span-1 border rounded-lg p-4 text-neutral-3000 border-neutral-400">
        <FreePlanContent user={user} />
      </div>

      {/* Pro Plan */}
      <div className="flex flex-col w-full col-start-1 row-span-1 border rounded-lg p-4">
        <ProPlanContent user={user} userSubscription={userSubscriptionDetail} />
      </div>

      {/* Ultra Plan */}
      <div className="flex flex-col w-full col-start-1 row-start-auto md:row-start-1 md:col-start-2 row-span-2 border rounded-lg p-4">
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
    <div className="flex mt-4 grow items-end justify-center">
      <div className="text-left text-neutral-500 p-2 text-xs">
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
        <span className="text-2xl py-0.5 font-bold">Free</span>
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
        <div className="flex items-center flex-col">
          <a
            target="_blank"
            rel="noreferrer"
            onClick={upgradeLinkOnClick}
            className="w-full px-4 py-2 border rounded-lg bg-white shadow border-none text-white font-semibold focus:outline-none mt-4 text-center text-sm cursor-pointer bg-gradient-to-r from-[#fd68a6] to-[#6c62f7]"
          >
            {t('Upgrade')}
          </a>
          <p className="text-xs text-neutral-400 mt-2">
            {t('No Strings Attached - Cancel Anytime!')}
          </p>
        </div>
      )}

      <ChangeSubscriptionButton
        plan="pro"
        user={user}
        userSubscription={userSubscription}
        interval="monthly"
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
        <div className="flex items-center flex-col">
          <a
            target="_blank"
            rel="noreferrer"
            onClick={upgradeLinkOnClick}
            className="w-full px-4 py-2 border rounded-lg bg-white shadow border-none text-white font-semibold focus:outline-none mt-4 text-center text-sm cursor-pointer bg-gradient-to-r from-[#fd68a6] to-[#6c62f7]"
          >
            {t('Upgrade to Ultra')}
          </a>
          <p className="text-xs text-neutral-400 mt-2">
            {t('No Strings Attached - Cancel Anytime!')}
          </p>
        </div>
      )}
      <ChangeSubscriptionButton
        plan="ultra"
        user={user}
        userSubscription={userSubscription}
        interval={priceType}
      />

      {user?.plan === 'pro' && user.proPlanExpirationDate && (
        <PlanExpirationDate expirationDate={user.proPlanExpirationDate} />
      )}
    </>
  );
};

const CurrentPlanTag = () => {
  return (
    <span className="h-max bg-neutral-600 text-neutral-400 text-[10px]  font-medium mr-2 px-2 py-[.5px] rounded w-max">
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
    return <span className="text-sm mb-2">{'TWD$249.99 / month'}</span>;
  }
  if (userSubscription && userSubscription.subscriptionCurrency === 'usd') {
    return <span className="text-sm mb-2">{'USD$9.99 / month'}</span>;
  }
  switch (i18n.language) {
    case 'zh-Hant':
    case 'zh':
      return <span className="text-sm mb-2">{'TWD$249.99 / month'}</span>;
    default:
      return <span className="text-sm mb-2">{'USD$9.99 / month'}</span>;
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
      return <span className="text-sm mb-2">{'TWD$880 / month'}</span>;
    }

    if (userSubscription && userSubscription.subscriptionCurrency === 'usd') {
      return <span className="text-sm mb-2">{'USD$29.99 / month'}</span>;
    }
    if (i18n.language === 'zh-Hant' || i18n.language === 'zh') {
      return <span className="text-sm mb-2">{'TWD$880 / month'}</span>;
    } else {
      return <span className="text-sm mb-2">{'USD$29.99 / month'}</span>;
    }
  }, [userSubscription, i18n.language]);

  const yearlyPriceComponent = useMemo(() => {
    if (userSubscription && userSubscription.subscriptionCurrency === 'twd') {
      return <span className="text-sm mb-2">{'TWD$8800 / year'}</span>;
    }
    if (userSubscription && userSubscription.subscriptionCurrency === 'usd') {
      return <span className="text-sm mb-2">{'USD$279.99 / year'}</span>;
    }

    if (i18n.language === 'zh-Hant' || i18n.language === 'zh') {
      return <span className="text-sm mb-2">{'TWD$8800 / year'}</span>;
    } else {
      return <span className="text-sm mb-2">{'USD$279.99 / year'}</span>;
    }
  }, [userSubscription, i18n.language]);

  return (
    <Tabs defaultValue="monthly" className="mt-2 mb-4 w-full">
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
