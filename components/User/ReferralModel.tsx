import { Dialog, Transition } from '@headlessui/react';
import { IconRefresh, IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import React, { Fragment, memo, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useTranslation } from 'next-i18next';

import { trackEvent } from '@/utils/app/eventTracking';
import type { CodeGenerationPayloadType } from '@/utils/server/referralCode';

import HomeContext from '@/components/home/home.context';

import CodeTimeLeft from '../Referral/CodeTimeLeft';
import ReferralProgramData from '../Referral/ReferralProgramData';
import Spinner from '../Spinner/Spinner';

type Props = {
  onClose: () => void;
};

const ReferralModel = memo(({ onClose }: Props) => {
  const { t } = useTranslation('model');
  const { t: sideBarT } = useTranslation('sidebar');
  const {
    state: { user },
    dispatch,
  } = useContext(HomeContext);

  const getReferralCode = async () => {
    const response = await fetch('/api/referral/get-code', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'user-id': user?.id || '',
      },
    });

    return (await response.json()) as CodeGenerationPayloadType;
  };

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // if user has no referral code, get one from server
    if (user && !user?.referralCode) {
      getReferralCode().then((res) => {
        dispatch({
          field: 'user',
          value: {
            ...user,
            referralCode: res.code,
            referralCodeExpirationDate: res.expiresAt,
          },
        });
      });
    }
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(user?.referralCode || '');
    toast.success(t('Copied to clipboard'));
  };

  const { isFetching: isRegenerating, refetch: queryReferralCodeRefetch } =
    useQuery<{ code: string; expiresAt: string }, Error>(
      ['regenerateReferralCode'],
      async () => {
        const response = await fetch('/api/referral/regenerate-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'user-id': user!.id,
          },
        });

        const data = (await response.json()) as {
          code: string;
          expiresAt: string;
        };
        return data;
      },
      {
        enabled: false,
        retry: false,
        onError: (error) => {
          console.error(error);
        },
        onSuccess: (data: { code: string; expiresAt: string }) => {
          dispatch({
            field: 'user',
            value: {
              ...user,
              referralCode: data.code,
              referralCodeExpirationDate: data.expiresAt,
            },
          });
          toast.success(t('A new referral code has been regenerated'));
        },
      },
    );

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose} open>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center text-center mobile:block">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="grid h-fit w-full max-w-[100rem] grid-rows-[max-content_1fr] overflow-hidden rounded-2xl bg-neutral-800 p-6 text-left align-middle text-neutral-200 shadow-xl transition-all mobile:h-dvh mobile:!max-w-[unset] mobile:!rounded-none tablet:max-w-[90vw]">
                <div className="mb-3 flex flex-row items-center justify-between">
                  <h1 className="text-xl">{sideBarT('Referral Program')}</h1>
                  <button className="min-h-[34px] w-max" onClick={onClose}>
                    <IconX></IconX>
                  </button>
                </div>

                {isLoading && (
                  <div className="mt-[50%] flex">
                    <Spinner size="16px" className="mx-auto" />
                  </div>
                )}
                {!isLoading && (
                  <div>
                    <div className="flex select-none flex-wrap items-center justify-between gap-2">
                      <div
                        onClick={handleCopy}
                        className="shrink-0 cursor-pointer"
                      >
                        {`${t('Your referral code is')}: `}
                        <span className="inline rounded bg-sky-100 p-1 font-mono text-sm font-bold text-slate-900 dark:bg-slate-600 dark:text-slate-200">
                          {user?.referralCode}
                        </span>
                      </div>
                      {user?.referralCodeExpirationDate && (
                        <CodeTimeLeft
                          endOfDay={user?.referralCodeExpirationDate}
                        />
                      )}
                    </div>
                    <button
                      className="mx-auto my-3 flex w-fit items-center gap-3 rounded border border-neutral-600 px-4 py-2 text-sm text-white  hover:opacity-50 md:mb-0 md:mt-2"
                      onClick={() => {
                        trackEvent('Regenerate referral code clicked');
                        queryReferralCodeRefetch();
                      }}
                      disabled={isRegenerating}
                    >
                      {isRegenerating ? (
                        <Spinner size="16px" />
                      ) : (
                        <IconRefresh />
                      )}

                      <div>{t('Regenerate code')}</div>
                    </button>
                    <ReferralProgramData />
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
});

ReferralModel.displayName = 'ReferralModel';

export default ReferralModel;
