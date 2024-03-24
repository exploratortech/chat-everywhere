import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useQuery } from '@tanstack/react-query';

import { userProfileQuery } from '@/utils/server/supabase';

import { UserProfileQueryProps } from '@/types/user';

const useUserProfile = ({
  userId,
  email,
}: Omit<UserProfileQueryProps, 'client'>) => {
  const supabaseClient = useSupabaseClient();

  return useQuery(
    ['userProfile'],
    async () =>
      await userProfileQuery({ client: supabaseClient, userId, email }),
    {
      enabled: false, // should be manually triggered
    },
  );
};

export default useUserProfile;
