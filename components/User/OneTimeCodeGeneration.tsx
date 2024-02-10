import { IconRefresh } from '@tabler/icons-react';
import React, { memo, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useTranslation } from 'next-i18next';

import { OneTimeCodePayload } from '@/types/one-time-code';

import HomeContext from '@/pages/api/home/home.context';

import CodeTimeLeft from '../Referral/CodeTimeLeft';
import Spinner from '../Spinner/Spinner';
import TemporaryAccountProfileList from './TemporaryAccountProfileList';

const OneTimeCodeGeneration = memo(() => {
  const { t } = useTranslation('model');
  const {
    state: { user },
  } = useContext(HomeContext);

  const [oneTimeCodeResponse, setOneTimeCodeResponse] =
    useState<OneTimeCodePayload | null>(null);

  const getOneTimeCode = async (invalidate: boolean = false) => {
    const response = await fetch(`/api/teacher-portal/get-code`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'user-id': user?.id || '',
        invalidate: invalidate ? 'true' : 'false',
      },
    });

    return (await response.json()) as OneTimeCodePayload;
  };

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getOneTimeCode().then((res) => {
        setOneTimeCodeResponse({
          code: res.code,
          expiresAt: res.expiresAt,
          tempAccountProfiles: res.tempAccountProfiles,
        });
      });
    }
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(oneTimeCodeResponse?.code || '');
    toast.success(t('Copied to clipboard'));
  };

  return (
    <div className="">
      <h1 className="text-lg font-bold mb-4">{t('One-time Code')}</h1>
      {isLoading && (
        <div className="flex mt-[50%]">
          <Spinner size="16px" className="mx-auto" />
        </div>
      )}
      {!isLoading && oneTimeCodeResponse?.code && (
        <div className="flex select-none justify-between items-center flex-wrap gap-2">
          <div onClick={handleCopy} className="cursor-pointer flex-shrink-0">
            {`${t('Your one-time code is')}: `}
            <span className="inline  bg-sky-100 font-bold text-sm text-slate-900 font-mono rounded dark:bg-slate-600 dark:text-slate-200 text-primary-500 p-1">
              {oneTimeCodeResponse?.code}
            </span>
          </div>
          {oneTimeCodeResponse?.expiresAt && (
            <CodeTimeLeft endOfDay={oneTimeCodeResponse.expiresAt} />
          )}
        </div>
      )}
      <button
        className="mx-auto my-3 flex w-fit items-center gap-3 rounded border text-sm py-2 px-4 hover:opacity-50 border-neutral-600  text-white md:mb-0 md:mt-2"
        onClick={() => {
          if (user) {
            setIsLoading(true);
            getOneTimeCode(true)
              .then((res) => {
                setOneTimeCodeResponse({
                  code: res.code,
                  expiresAt: res.expiresAt,
                  tempAccountProfiles: res.tempAccountProfiles,
                });
              })
              .finally(() => {
                setIsLoading(false);
              });
          }
        }}
        disabled={isLoading}
      >
        {isLoading ? <Spinner size="16px" /> : <IconRefresh />}
        <div>{t('Regenerate code')}</div>
      </button>{' '}
      {!isLoading && oneTimeCodeResponse?.code && (
        <TemporaryAccountProfileList
          tempAccountProfiles={oneTimeCodeResponse.tempAccountProfiles}
        />
      )}
    </div>
  );
});

OneTimeCodeGeneration.displayName = 'OneTimeCodeGeneration';

export default OneTimeCodeGeneration;
