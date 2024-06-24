import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { User, UserSubscriptionDetail } from '@/types/user';

export const useUserSubscriptionDetail = ({
  isPaidUser,
  user,
}: {
  isPaidUser: boolean;
  user: User | null;
}) => {
  const { t } = useTranslation('common');
  const supabase = useSupabaseClient();

  const fetchUserSubscriptionDetail =
    async (): Promise<UserSubscriptionDetail> => {
      const accessToken = (await supabase.auth.getSession()).data.session
        ?.access_token!;

      const response = await fetch('/api/stripe/user-subscription-detail', {
        method: 'GET',
        headers: {
          'access-token': accessToken,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = (await response.json())?.data;

      // NOTE: return undefined will be triggered as error in useQuery
      return data
        ? data
        : {
            userPlan: user?.plan || null,
            subscriptionCurrency: 'usd',
          };
    };

  return useQuery(
    ['userSubscriptionDetail', isPaidUser],
    fetchUserSubscriptionDetail,
    {
      cacheTime: 0,
      enabled: isPaidUser,
      onError: (error) => {
        console.error('Error fetching user subscription detail:', error);
        toast.error(
          t(
            'There was a problem fetching user subscription detail, please contact support team',
          ),
        );
      },
    },
  );
};
