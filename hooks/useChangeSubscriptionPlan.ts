import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useMutation } from '@tanstack/react-query';
import { useContext } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import HomeContext from '@/components/home/home.context';

export const useChangeSubscriptionPlan = () => {
  const supabase = useSupabaseClient();
  const {
    state: { user },
  } = useContext(HomeContext);
  const { t } = useTranslation('common');

  const changeSubscriptionPlan = async (priceId: string) => {
    if (!user) {
      throw new Error('User is not authenticated');
    }
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token!;
    const response = await fetch('/api/stripe/change-subscription-plan', {
      method: 'POST',
      headers: {
        'access-token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ priceId }),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    console.log(data);
    return data.subscription;
  };

  return useMutation(changeSubscriptionPlan, {
    onError: (error) => {
      if (error instanceof Error) {
        console.log(error.message);
      }
      toast.error(
        t(
          'There was a problem when changing subscription plan, please contact support team',
        ),
      );
    },
  });
};
