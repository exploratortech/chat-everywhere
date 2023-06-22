import { Dialog, Transition } from '@headlessui/react';
import { IconX } from '@tabler/icons-react';
import React, { Fragment, memo, useContext, useState } from 'react';

import { useTranslation } from 'next-i18next';

import HomeContext from '@/pages/api/home/home.context';

import Spinner from '../Spinner/Spinner';

import dayjs from 'dayjs';

function formatDatetime(dateString: string) {
  return dayjs(dateString).format('YYYY/MM/DD');
}

type Props = {
  onClose: () => void;
};

const ReferralModel = memo(({ onClose }: Props) => {
  const { t } = useTranslation('model');
  const {
    state: { user },
    dispatch,
  } = useContext(HomeContext);

  const [isLoading, setIsLoading] = useState(false);

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
              <Dialog.Panel className="w-full max-w-3xl tablet:max-w-[90vw] h-[80vh] transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all bg-neutral-800 text-neutral-200 grid grid-rows-[max-content_1fr] mobile:h-[100dvh] mobile:!max-w-[unset] mobile:!rounded-none">
                <div className="mb-3 flex flex-row justify-between items-center">
                  <h1>{t('Referral Program')}</h1>
                  <button className="w-max min-h-[34px]" onClick={onClose}>
                    <IconX></IconX>
                  </button>
                </div>

                <div>
                  Your referral code is:{' '}
                  <span className="text-primary-500">{user?.referralCode}</span>
                </div>
                {isLoading && (
                  <div className="flex mt-[50%]">
                    <Spinner size="16px" className="mx-auto" />
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
