import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useCallback, useContext } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { updateConversationWithNewContent } from '@/utils/app/conversation';
import { executeButtonCommand } from '@/utils/app/mjServiceHelper';

import HomeContext from '@/components/home/home.context';

const useRunButtonCommand = () => {
  const { t: commonT } = useTranslation('common');
  const {
    state: { user, selectedConversation, conversations },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const supabase = useSupabaseClient();
  const runButtonCommand = useCallback(
    async (button: string, messageId: string, messageIndex: number) => {
      if (!user) {
        return toast.error(commonT('Please sign in to use ai image feature'));
      }
      const accessToken = (await supabase.auth.getSession()).data.session
        ?.access_token;
      if (!accessToken) {
        return toast.error(commonT('Please sign in to use ai image feature'));
      }
      if (!selectedConversation) return;

      const newHtml = await executeButtonCommand(
        {
          messageId,
          button,
        },
        accessToken,
      );

      await updateConversationWithNewContent({
        conversations,
        selectedConversation,
        messageIndex,
        homeDispatch,
        newHtml,
      });
    },
    [
      commonT,
      conversations,
      homeDispatch,
      selectedConversation,
      supabase.auth,
      user,
    ],
  );

  return runButtonCommand;
};

export default useRunButtonCommand;
