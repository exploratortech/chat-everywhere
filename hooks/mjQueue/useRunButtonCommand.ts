import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useCallback, useContext } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { updateConversationWithNewContent } from '@/utils/app/conversation';

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
        return;
      }
      if (!selectedConversation) return;

      const newHtml = await postButtonCommand(button, messageId, accessToken);

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

const postButtonCommand = async (
  button: string,
  messageId: string,
  accessToken: string,
) => {
  const response = await fetch(`/api/mj-queue/initBtnCommand`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'user-token': accessToken,
    },
    body: JSON.stringify({
      button,
      messageId,
    }),
  });

  if (!response.ok) {
    console.log({
      text: await response.text(),
    });
    throw new Error('Network response was not ok');
  }
  return await response.text();
};
