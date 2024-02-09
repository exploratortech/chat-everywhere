import React, { memo, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useTranslation } from 'next-i18next';

import { OneTimeCodePayload } from '@/types/one-time-code';

import HomeContext from '@/pages/api/home/home.context';

import CodeTimeLeft from '../Referral/CodeTimeLeft';
import Spinner from '../Spinner/Spinner';
import TemporaryAccountProfileList from './TemporaryAccountProfileList';

const SharedMessages = memo(() => {
  const { t } = useTranslation('model');
  const {
    state: { user },
  } = useContext(HomeContext);

  // const [oneTimeCodeResponse, setOneTimeCodeResponse] =
  //   useState<OneTimeCodePayload | null>(null);

  // const getOneTimeCode = async () => {
  //   const response = await fetch('/api/teacher-portal/get-code', {
  //     method: 'GET',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'user-id': user?.id || '',
  //     },
  //   });

  //   return (await response.json()) as OneTimeCodePayload;
  // };

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // if user has no referral code, get one from server
    if (user) {
      // getOneTimeCode().then((res) => {
      //   setOneTimeCodeResponse({
      //     code: res.code,
      //     expiresAt: res.expiresAt,
      //     tempAccountProfiles: res.tempAccountProfiles,
      //   });
      // });
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
      {!isLoading && <div>Finished loading</div>}
    </div>
  );
});

SharedMessages.displayName = 'SharedMessages';

export default SharedMessages;
