import { useSupabaseClient } from '@supabase/auth-helpers-react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from 'react-query';

import { Tag } from '@/types/tags';

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
    return data.tags as Tag[];
  };

  const addTag = async (tagName: string) => {
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token;
    if (!accessToken) {
      throw new Error('No access token');
    }
    const response = await fetch('/api/teacher-portal/add-teacher-tag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
      },
      body: JSON.stringify({ tag_name: tagName }),
    });
    if (!response.ok) {
      throw new Error('Failed to add tag');
    }
    return (await response.json()) as {
      isAdded: boolean;
    };
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
    return (await response.json()) as {
      isRemoved: boolean;
    };
  };

  return {
    fetchQuery: useQuery('teacher-tags', fetchTags, { staleTime: 600000 }),
    addTeacherTag: useMutation(addTag, {
      onSuccess: (res) => {
        if (res.isAdded) {
          queryClient.invalidateQueries('teacher-tags');
        } else {
          toast.error('Failed to add tag');
        }
      },
    }),
    removeTeacherTags: useMutation(removeTags, {
      onSuccess: (res) => {
        if (res.isRemoved) {
          queryClient.invalidateQueries('teacher-tags');
        } else {
          toast.error('Failed to remove tags');
        }
      },
    }),
  };
};
export default useTeacherTags;
