import { useSupabaseClient } from '@supabase/auth-helpers-react';
import React, { memo, useContext, useEffect, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { ShareMessagesByTeacherProfilePayload } from '@/types/share-messages-by-teacher-profile';

import HomeContext from '@/pages/api/home/home.context';

import Spinner from '../../Spinner/Spinner';
import SharedMessageItem from './SharedMessageItem';

const SharedMessages = memo(() => {
  const { t } = useTranslation('model');
  const supabase = useSupabaseClient();
  const [isLoading, setIsLoading] = useState(true);
  const {
    state: { user },
  } = useContext(HomeContext);

  const [sharedMessages, setSharedMessages] = useState<
    ShareMessagesByTeacherProfilePayload['submissions'] | null
  >(null);

  const getSharedMessagesWithTeacher = async () => {
    const payload = {
      accessToken: (await supabase.auth.getSession()).data.session
        ?.access_token,
    };
    try {
      const response = await fetch('/api/get-shared-messages-with-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (response.status !== 200 || !response.ok) {
        setIsLoading(false);
        return null;
      }
      setIsLoading(false);
      return (await response.json()) as ShareMessagesByTeacherProfilePayload;
    } catch (error) {
      console.error(
        'There has been a problem with your fetch operation:',
        error,
      );
      setIsLoading(false);
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      getSharedMessagesWithTeacher().then((res) => {
        setSharedMessages(res?.submissions || null);
      });
    }
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="">
      <h1 className="font-bold mb-4">{t('Shared Messages')}</h1>
      {isLoading && (
        <div className="flex mt-[50%]">
          <Spinner size="16px" className="mx-auto" />
        </div>
      )}
      {!isLoading && (!sharedMessages || !sharedMessages?.length) && (
        <div>No Submissions</div>
      )}
      <div className="flex flex-wrap gap-4">
        {sharedMessages?.map((submission) => (
          <SharedMessageItem
            className="max-w-[300px] max-h-[300px] w-full overflow-hidden"
            key={submission.id}
            submission={submission}
          />
        ))}
      </div>
    </div>
  );
});

SharedMessages.displayName = 'SharedMessages';

export default SharedMessages;
