import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { OrderedSubscriptionPlans } from '@/utils/app/const';

import type { StripeProductPaidPlanType } from '@/types/stripe-product';
import type { UserSubscriptionDetail } from '@/types/user';

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
  userSubscription: UserSubscriptionDetail | undefined;
}> = ({ plan, userSubscription }) => {
  const { t } = useTranslation('model');

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
          <div className="flex flex-col items-center">
            <a
              target="_blank"
              rel="noreferrer"
              className="mt-4 w-full cursor-pointer rounded-lg border border-none bg-white bg-gradient-to-r from-[#fd68a6] to-[#6c62f7] px-4 py-2 text-center text-sm font-semibold text-white shadow focus:outline-none"
            >
              {t(`Downgrade to ${plan === 'pro' ? 'Pro' : 'Ultra'} Plan`)}
            </a>
          </div>
        ) : showUpgradeButton ? (
          <div className="flex flex-col items-center">
            <a
              target="_blank"
              rel="noreferrer"
              className="mt-4 w-full cursor-pointer rounded-lg border border-none bg-white bg-gradient-to-r from-[#fd68a6] to-[#6c62f7] px-4 py-2 text-center text-sm font-semibold text-white shadow focus:outline-none"
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
};

export default ChangeSubscriptionButton;
