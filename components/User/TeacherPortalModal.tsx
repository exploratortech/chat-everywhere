import { Dialog, Transition } from '@headlessui/react';
import { IconX } from '@tabler/icons-react';
import React, { Fragment, memo, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useTranslation } from 'next-i18next';

import { OneTimeCodePayload } from '@/types/one-time-code';

import HomeContext from '@/pages/api/home/home.context';

import CodeTimeLeft from '../Referral/CodeTimeLeft';
import Spinner from '../Spinner/Spinner';
import TemporaryAccountProfileList from './TemporaryAccountProfileList';

type Props = {
  onClose: () => void;
};

const TeacherPortalModal = memo(({ onClose }: Props) => {
  const { t } = useTranslation('model');
  const { t: sideBarT } = useTranslation('sidebar');
  const {
    state: { user },
    dispatch,
  } = useContext(HomeContext);

  const [oneTimeCodeResponse, setOneTimeCodeResponse] =
    useState<OneTimeCodePayload | null>(null);

  const getOneTimeCode = async () => {
    const response = await fetch('/api/teacher-portal/get-code', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'user-id': user?.id || '',
      },
    });

    return (await response.json()) as OneTimeCodePayload;
  };

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // if user has no referral code, get one from server
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
    navigator.clipboard.writeText(user?.referralCode || '');
    toast.success(t('Copied to clipboard'));
  };

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
              <Dialog.Panel className="w-full max-w-[100rem] tablet:max-w-[90vw] h-fit transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all bg-neutral-800 text-neutral-200 grid grid-rows-[max-content_1fr] mobile:h-[100dvh] mobile:!max-w-[unset] mobile:!rounded-none">
                <div className="mb-3 flex flex-row justify-between items-center">
                  <h1 className="text-xl">{sideBarT('Teacher Portal')}</h1>
                  <button className="w-max min-h-[34px]" onClick={onClose}>
                    <IconX></IconX>
                  </button>
                </div>

                {isLoading && (
                  <div className="flex mt-[50%]">
                    <Spinner size="16px" className="mx-auto" />
                  </div>
                )}
                {!isLoading && (
                  <div>
                    <div className="flex select-none justify-between items-center flex-wrap gap-2">
                      <div
                        onClick={handleCopy}
                        className="cursor-pointer flex-shrink-0"
                      >
                        {`${t('Your one-time code is')}: `}
                        <span className="inline  bg-sky-100 font-bold text-sm text-slate-900 font-mono rounded dark:bg-slate-600 dark:text-slate-200 text-primary-500 p-1">
                          {oneTimeCodeResponse?.code}
                        </span>
                      </div>
                      {oneTimeCodeResponse?.expiresAt && (
                        <CodeTimeLeft
                          endOfDay={oneTimeCodeResponse.expiresAt}
                        />
                      )}
                    </div>

                    {oneTimeCodeResponse?.code && (
                      <TemporaryAccountProfileList
                        tempAccountProfiles={
                          oneTimeCodeResponse.tempAccountProfiles
                        }
                      />
                    )}
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

TeacherPortalModal.displayName = 'TeacherPortalModal';

export default TeacherPortalModal;
