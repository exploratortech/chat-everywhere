import { useSupabaseClient } from '@supabase/auth-helpers-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from 'react-query';

import { TeacherPromptForTeacherPortal } from '@/types/prompt';

import useTeacherPortalLoading from './useTeacherPortalLoading';

const useTeacherPrompt = () => {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();
  const { t } = useTranslation('model');
  const { withLoading } = useTeacherPortalLoading();

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
    return data.prompts as TeacherPromptForTeacherPortal[];
  };

  const createPrompt = async (prompt: TeacherPromptForTeacherPortal) => {
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token;
    if (!accessToken) {
      throw new Error('No access token');
    }
    const response = await fetch('/api/teacher-portal/create-teacher-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
      },
      body: JSON.stringify({ prompt: { ...prompt, id: undefined } }),
    });
    if (!response.ok) {
      throw new Error('Failed to create prompt');
    }
    return await response.json();
  };

  const updatePrompt = async (prompt: TeacherPromptForTeacherPortal) => {
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

  const removePrompt = async (promptId: string) => {
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token;
    if (!accessToken) {
      throw new Error('No access token');
    }
    const response = await fetch('/api/teacher-portal/remove-teacher-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
      },
      body: JSON.stringify({ prompt_id: promptId }),
    });
    if (!response.ok) {
      throw new Error('Failed to remove prompt');
    }
    return await response.json();
  };

  return {
    fetchQuery: useQuery('teacher-prompts', () => withLoading(fetchPrompts), {
      staleTime: 600000,
    }),
    createMutation: useMutation(createPrompt, {
      onSuccess: () => {
        queryClient.invalidateQueries('teacher-prompts');
        queryClient.refetchQueries('teacher-prompts');
        toast.success(t('Prompt created successfully'));
      },
      onError: (error) => {
        toast.error(t('Error creating prompt'));
        console.error(error);
      },
    }),
    updateMutation: useMutation(
      (prompt: TeacherPromptForTeacherPortal) =>
        withLoading(() => updatePrompt(prompt)),
      {
        onSuccess: () => {
          queryClient.invalidateQueries('teacher-prompts');
          queryClient.refetchQueries('teacher-prompts');
          toast.success(t('Prompt updated successfully'));
        },
        onError: (error) => {
          toast.error(t('Error updating prompt'));
          console.error(error);
        },
      },
    ),
    removeMutation: useMutation(
      (promptId: string) => withLoading(() => removePrompt(promptId)),
      {
        onSuccess: () => {
          queryClient.invalidateQueries('teacher-prompts');
          queryClient.refetchQueries('teacher-prompts');
          toast.success(t('Prompt removed successfully'));
        },
        onError: (error) => {
          toast.error(t('Error removing prompt'));
          console.error(error);
        },
      },
    ),
  };
};
export default useTeacherPrompt;
