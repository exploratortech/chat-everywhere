import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { UserSubscriptionDetail } from '@/types/user';

export const useUserSubscriptionDetail = ({
  isPaidUser,
}: {
  isPaidUser: boolean;
}) => {
  const { t } = useTranslation('common');
  const supabase = useSupabaseClient();

  const fetchUserSubscriptionDetail = async (): Promise<
    UserSubscriptionDetail | undefined
  > => {
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

    return (await response.json())?.data;
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
