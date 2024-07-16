import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useQuery } from '@tanstack/react-query';

import type { TeacherSettings } from '@/types/teacher-settings';

const useTeacherSettingsForStudent = () => {
  const supabase = useSupabaseClient();

  return useQuery(
    ['teacherSettingsForStudent'],
    async () => {
      const accessToken = (await supabase.auth.getSession()).data.session
        ?.access_token;
      if (!accessToken) {
        throw new Error('No access token');
      }
      const res = await fetch('/api/teacher-settings-for-student', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access-token': accessToken,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch teacher Settings');
      }
      const data = await res.json();
      return data as {
        settings: TeacherSettings;
      };
    },
    {
      enabled: false,
    },
  );
};

export default useTeacherSettingsForStudent;
