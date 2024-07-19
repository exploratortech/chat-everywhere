import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useState } from 'react';

import { PluginID } from '@/types/plugin';
import type { CreditUsage } from '@/types/user';

export const useFetchCreditUsage = () => {
  const [creditUsage, setCreditUsage] = useState<CreditUsage | null>(null);

  const supabaseClient = useSupabaseClient();

  const fetchAndUpdateCreditUsage = async (
    userId: string,
    isPaidUser: boolean,
  ) => {
    if (!isPaidUser) return;

    const { data, error } = await supabaseClient
      .from('user_credits')
      .select('*')
      .eq('user_id', userId);

    const gpt4Credits = formatDbValue(
      data?.find((creditRow) => creditRow.api_type === PluginID.GPT4)?.balance,
    );
    const imageGenCredits = formatDbValue(
      data?.find((creditRow) => creditRow.api_type === PluginID.IMAGE_GEN)
        ?.balance,
    );

    if (error) {
      console.error(error);
    } else if (data.length !== 0) {
      setCreditUsage({
        [PluginID.GPT4]: {
          remainingCredits: gpt4Credits,
        },
        [PluginID.IMAGE_GEN]: {
          remainingCredits: imageGenCredits,
        },
      });
    }
  };

  return { fetchAndUpdateCreditUsage, creditUsage };
};

const formatDbValue = (input: number | null | undefined) => {
  if (input === undefined || input === null) {
    return null;
  } else if (input === 0) {
    return 0;
  } else {
    return input;
  }
};
