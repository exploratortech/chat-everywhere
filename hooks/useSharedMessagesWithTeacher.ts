import { useSupabaseClient } from '@supabase/auth-helpers-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from 'react-query';

const useSharedMessagesWithTeacher = () => {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();
  const { t } = useTranslation('model');

  const removeSharedMessages = async (messageIds: string[]) => {
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token;
    if (!accessToken) {
      throw new Error('No access token');
    }
    const response = await fetch('/api/teacher-portal/remove-shared-messages-with-teacher', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
      },
      body: JSON.stringify({ message_ids: messageIds }),
    });
    if (!response.ok) {
      throw new Error('Failed to remove shared messages');
    }
    return await response.json();
  };

  return {
    removeMutation: useMutation(removeSharedMessages, {
      onSuccess: () => {
        queryClient.invalidateQueries('shared-messages-with-teacher');
        toast.success(t('Messages removed successfully'));
      },
      onError: (error) => {
        toast.error(t('Error removing messages'));
        console.error(error);
      },
    }),
  };
};
export default useSharedMessagesWithTeacher;
