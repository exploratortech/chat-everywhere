import { useSupabaseClient } from '@supabase/auth-helpers-react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from 'react-query';

import { TeacherPrompt } from '@/types/prompt';

const useTeacherPrompt = () => {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const fetchPrompts = async () => {
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token;
    if (!accessToken) {
      throw new Error('No access token');
    }
    const response = await fetch('/api/teacher-portal/get-teacher-prompt', {
      headers: {
        'access-token': accessToken,
      },
    });
    const data = await response.json();
    return data.prompts as TeacherPrompt[];
  };

  const updatePrompt = async (prompt: TeacherPrompt) => {
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token;
    if (!accessToken) {
      throw new Error('No access token');
    }
    const response = await fetch('/api/teacher-portal/update-teacher-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
      },
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) {
      throw new Error('Failed to update prompt');
    }
    return await response.json();
  };

  return {
    fetchQuery: useQuery('teacher-prompts', fetchPrompts, {
      staleTime: 600000,
    }),
    updateMutation: useMutation(updatePrompt, {
      onSuccess: () => {
        queryClient.invalidateQueries('teacher-prompts');
      },
    }),
  };
};
export default useTeacherPrompt;
