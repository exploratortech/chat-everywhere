import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useMutation, useQuery, useQueryClient } from 'react-query';

const useTeacherTags = () => {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const fetchTags = async () => {
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token;
    if (!accessToken) {
      throw new Error('No access token');
    }
    const response = await fetch('/api/teacher-portal/teacher-tags', {
      headers: {
        'access-token': accessToken,
      },
    });
    const data = await response.json();
    return data as { tags: { id: number; name: string }[] };
  };

  const removeTags = async (tagIds: number[]) => {
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token;
    if (!accessToken) {
      throw new Error('No access token');
    }
    const response = await fetch('/api/teacher-portal/remove-teacher-tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
      },
      body: JSON.stringify({ tag_ids: tagIds }),
    });
    if (!response.ok) {
      throw new Error('Failed to remove tags');
    }
    return response.json();
  };

  return {
    fetchQuery: useQuery('teacher-tags', fetchTags),
    removeTeacherTags: useMutation(removeTags, {
      onSuccess: () => {
        queryClient.invalidateQueries('teacher-tags');
      },
    }),
  };
};
export default useTeacherTags;
