import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useMutation, useQuery } from '@tanstack/react-query';

const useTeacherOneTimeCodeTagsManagement = (code_id: string) => {
  const supabase = useSupabaseClient();

  const getCodeTags = async (): Promise<number[]> => {
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token;
    if (!accessToken) {
      throw new Error('No access token');
    }
    const response = await fetch('/api/teacher-portal/get-code-tags', {
      method: 'GET',
      headers: {
        'access-token': accessToken,
        code_id: code_id,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to get code tags');
    }
    const data = await response.json();
    return data.selected_tag_ids as number[];
  };

  const setCodeTags = async (tag_ids: number[]): Promise<void> => {
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token;
    if (!accessToken) {
      throw new Error('No access token');
    }
    const response = await fetch('/api/teacher-portal/set-code-tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
      },
      body: JSON.stringify({ code_id, tag_ids }),
    });
    if (!response.ok) {
      throw new Error('Failed to set code tags');
    }
  };

  return {
    getCodeTagsQuery: useQuery(['code-tags', code_id], getCodeTags, {
      enabled: !!code_id,
    }),
    setCodeTagsMutation: useMutation(setCodeTags),
  };
};

export default useTeacherOneTimeCodeTagsManagement;
