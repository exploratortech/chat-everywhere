import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { OrderedSubscriptionPlans } from '@/utils/app/const';

import {
  AvailablePaidPlanType,
  StripeProductPaidPlanType,
} from '@/types/stripe-product';
import { User, UserSubscriptionDetail } from '@/types/user';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const ChangeSubscriptionButton: React.FC<{
  plan: StripeProductPaidPlanType;
  user: User | null;
  userSubscription: UserSubscriptionDetail | undefined;
  interval: 'monthly' | 'yearly';
}> = ({ plan, userSubscription, user, interval }) => {
  const { t } = useTranslation('model');
  const availablePlan = useMemo<AvailablePaidPlanType>(() => {
    if (plan === 'pro') {
      return 'pro-monthly';
    } else {
      if (interval === 'monthly') {
        return 'ultra-monthly';
      } else {
        return 'ultra-yearly';
      }
    }
  }, [plan, interval]);

  const showUpgradeButton = useMemo(() => {
    if (!userSubscription) return false;
    if (!userSubscription.userPlan) return false;
    return (
      OrderedSubscriptionPlans.indexOf(plan) >
      OrderedSubscriptionPlans.indexOf(userSubscription.userPlan)
    );
  }, [userSubscription, plan]);

  const showDowngradeButton = useMemo(() => {
    if (!userSubscription) return false;
    if (!userSubscription.userPlan) return false;
    return (
      OrderedSubscriptionPlans.indexOf(plan) <
      OrderedSubscriptionPlans.indexOf(userSubscription.userPlan)
    );
  }, [userSubscription, plan]);

  // Only show upgrade/downgrade button if user has a valid subscription
  if (!userSubscription) return null;

  return (
    <Dialog>
      <DialogTrigger>
        {showDowngradeButton ? (
          <div className="flex items-center flex-col">
            <a
              target="_blank"
              rel="noreferrer"
              className="w-full px-4 py-2 border rounded-lg bg-white shadow border-none text-white font-semibold focus:outline-none mt-4 text-center text-sm cursor-pointer bg-gradient-to-r from-[#fd68a6] to-[#6c62f7]"
            >
              {t(`Downgrade to ${plan === 'pro' ? 'Pro' : 'Ultra'} Plan`)}
            </a>
          </div>
        ) : showUpgradeButton ? (
          <div className="flex items-center flex-col">
            <a
              target="_blank"
              rel="noreferrer"
              className="w-full px-4 py-2 border rounded-lg bg-white shadow border-none text-white font-semibold focus:outline-none mt-4 text-center text-sm cursor-pointer bg-gradient-to-r from-[#fd68a6] to-[#6c62f7]"
            >
              {t(`Upgrade to ${plan === 'pro' ? 'Pro' : 'Ultra'} Plan`)}
            </a>
          </div>
        ) : null}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-white">
            {t('Need Assistance with Subscription Change?')}
          </DialogTitle>
          <DialogDescription className="p-4">
            {t(
              'If you wish to upgrade or downgrade your subscription, kindly contact our support team via email at',
            )}
            <a
              href={`mailto:jack@exploratorlabs.com?subject=${
                showDowngradeButton
                  ? 'Required%20downgrade%20subscription'
                  : showUpgradeButton
                  ? 'Required%20upgrade%20subscription'
                  : 'Subscription%20Inquiry'
              }`}
            >
              jack@exploratorlabs.com
            </a>
            .
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );

  return null;
};

export default ChangeSubscriptionButton;
