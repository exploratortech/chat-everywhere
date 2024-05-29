import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useMutation } from '@tanstack/react-query';
import { useContext } from 'react';

import HomeContext from '@/components/home/home.context';

export const useChangeSubscriptionPlan = () => {
  const supabase = useSupabaseClient();
  const {
    state: { user },
  } = useContext(HomeContext);

  const changeSubscriptionPlan = async () => {
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
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data.subscription;
  };

  return useMutation(changeSubscriptionPlan, {
    onError: (error) => {
      console.error('There was a problem with your mutation operation:', error);
    },
  });
};
