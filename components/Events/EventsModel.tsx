import { Dialog, Transition } from '@headlessui/react';
import { IconX } from '@tabler/icons-react';
import React, {
  Fragment,
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useTranslation } from 'next-i18next';
import Image from 'next/image';

type Props = {
  className?: string;
  open: boolean;
  onClose: () => void;
};

const EventsModel = memo(({ className = '', open, onClose }: Props) => {
  const { t } = useTranslation('model');

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as="div"
        className={`${className} relative z-50`}
        onClose={onClose}
        open={open}
      >
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
                  <h1>{t('Upcoming events')}</h1>
                  <button className="w-max min-h-[34px]" onClick={onClose}>
                    <IconX></IconX>
                  </button>
                </div>
                <div className="flex flex-col justify-between items-center overflow-y-auto">
                  <div className="flex flex-col justify-between items-center">
                    <Image
                      src="/assets/posters/20240326.png"
                      alt="20240326 event"
                      className="inline-block mb-4"
                      width="500"
                      height="500"
                    />
                    <div className="flex flex-row gap-2">
                      <button
                        className={`border border-neutral-600 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md text-sm dark:text-gray-100 dark:hover:bg-transparent`}
                        onClick={() => {
                          window.open(
                            'https://calendar.google.com/calendar/event?action=TEMPLATE&tmeid=XzZrcWpnaDI1ODRvMzRiOWo4cDFqZWI5azZkMzNpYmEyNm9wamNiYTU4NHM0NmQyNTcxMzQ2ZDIzOGsgamFja0BleHBsb3JhdG9ybGFicy5jb20&tmsrc=jack%40exploratorlabs.com',
                            '_blank',
                          );
                        }}
                      >
                        {t('Add to your calendar')}
                      </button>

                      <button
                        className={`border border-neutral-600 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md text-sm dark:text-gray-100 dark:hover:bg-transparent`}
                        onClick={() => {
                          window.open(
                            'https://meet.google.com/kjd-axqs-ggu',
                            '_blank',
                          );
                        }}
                      >
                        {t('Join event!')}
                      </button>
                    </div>

                    <hr className="my-4" />
                    <Image
                      src="/assets/posters/20240331.jpg"
                      alt="20240331 event"
                      className="inline-block mb-4"
                      width="500"
                      height="500"
                    />
                    <div className="flex flex-row gap-2">
                      <button
                        className={`border border-neutral-600 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md text-sm dark:text-gray-100 dark:hover:bg-transparent`}
                        onClick={() => {
                          window.open(
                            'https://docs.google.com/forms/d/e/1FAIpQLSfAC7Gt2c1nplur0EPhSh3xWHOSI93Sc_zLVnaJIxkdK0MgbA/viewform',
                            '_blank',
                          );
                        }}
                      >
                        {t('Sign up')}
                      </button>

                      <button
                        className={`border border-neutral-600 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md text-sm dark:text-gray-100 dark:hover:bg-transparent`}
                        onClick={() => {
                          window.open(
                            'https://meet.google.com/fng-jczz-iyv',
                            '_blank',
                          );
                        }}
                      >
                        {t('Join event!')}
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
});

EventsModel.displayName = 'EventsModel ';

export default EventsModel;
