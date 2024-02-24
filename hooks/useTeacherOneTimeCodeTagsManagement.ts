import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useQuery } from 'react-query';

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

  return {
    getCodeTagsQuery: useQuery(['code-tags', code_id], getCodeTags, {
      enabled: !!code_id,
    }),
  };
};

export default useTeacherOneTimeCodeTagsManagement;
