import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useQuery } from 'react-query';

import { TeacherPrompt } from '@/types/prompt';

const useTeacherPromptForStudent = () => {
  const supabase = useSupabaseClient();

  return useQuery(
    ['teacherPromptForStudent'],
    async () => {
      const accessToken = (await supabase.auth.getSession()).data.session
        ?.access_token;
      if (!accessToken) {
        throw new Error('No access token');
      }
      const res = await fetch('/api/teacher-prompt-for-student', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access-token': accessToken,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch teacher prompt');
      }
      const data = await res.json();
      return data as {
        prompts: TeacherPrompt[];
      };
    },
    {
      enabled: false,
    },
  );
};

export default useTeacherPromptForStudent;
