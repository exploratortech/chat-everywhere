import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { TeacherSettingsInPortal } from '@/types/teacher-settings';

import useTeacherPortalLoading from './useTeacherPortalLoading';

const useTeacherSettings = () => {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const fetchTeacherSettings = async () => {
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token;
    if (!accessToken) {
      throw new Error('No access token');
    }
    const response = await fetch('/api/teacher-portal/get-teacher-settings', {
      headers: {
        'access-token': accessToken,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch teacher settings');
    }
    const data = await response.json();
    return data.settings as TeacherSettingsInPortal;
  };

  const updateTeacherSettings = async (settings: TeacherSettingsInPortal) => {
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token;
    if (!accessToken) {
      throw new Error('No access token');
    }
    const response = await fetch(
      '/api/teacher-portal/update-teacher-settings',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access-token': accessToken,
        },
        body: JSON.stringify({ settings }),
      },
    );
    if (!response.ok) {
      throw new Error('Failed to update teacher settings');
    }
    return await response.json();
  };

  const { withLoading } = useTeacherPortalLoading();
  return {
    fetchSettingsQuery: useQuery(
      ['teacher-settings'],
      () => withLoading(fetchTeacherSettings),
      {
        staleTime: 600000,
        refetchOnWindowFocus: true,
      },
    ),
    updateSettingsMutation: useMutation(
      (settings: TeacherSettingsInPortal) =>
        withLoading(() => updateTeacherSettings(settings)),
      {
        onMutate: async (newSettings) => {
          await queryClient.cancelQueries(['teacher-settings']);
          const previousSettings =
            queryClient.getQueryData<TeacherSettingsInPortal>([
              'teacher-settings',
            ]);
          queryClient.setQueryData<TeacherSettingsInPortal>(
            ['teacher-settings'],
            (old) => {
              return {
                ...old,
                ...newSettings,
              };
            },
          );
          return { previousSettings };
        },
        onError: (error, _newSettings, context) => {
          console.error(error);
          if (context?.previousSettings) {
            queryClient.setQueryData(
              ['teacher-settings'],
              context.previousSettings,
            );
          }
        },
        onSettled: () => {
          queryClient.invalidateQueries({
            queryKey: ['teacher-settings'],
          });
        },
      },
    ),
  };
};
export default useTeacherSettings;
