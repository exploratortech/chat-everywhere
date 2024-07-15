import { Dialog, Transition } from '@headlessui/react';
import { IconX } from '@tabler/icons-react';
import React, { Fragment, memo } from 'react';

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
              <Dialog.Panel className="grid h-[80vh] w-full max-w-3xl grid-rows-[max-content_1fr] overflow-hidden rounded-2xl bg-neutral-800 p-6 text-left align-middle text-neutral-200 shadow-xl transition-all mobile:h-dvh mobile:!max-w-[unset] mobile:!rounded-none tablet:max-w-[90vw]">
                <div className="mb-3 flex flex-row items-center justify-between">
                  <h1>{t('Upcoming events')}</h1>
                  <button className="min-h-[34px] w-max" onClick={onClose}>
                    <IconX></IconX>
                  </button>
                </div>
                <div className="flex flex-col items-center justify-between overflow-y-auto">
                  <div className="flex flex-col items-center justify-between">
                    <Image
                      src="/assets/posters/20240504.jpg"
                      alt="20240504 event"
                      className="mb-4 inline-block"
                      width="500"
                      height="500"
                    />
                    <div className="flex flex-row gap-2">
                      <button
                        className={`rounded-md border border-neutral-600 px-4 py-2 text-sm text-gray-800 hover:bg-gray-200 dark:text-gray-100 dark:hover:bg-transparent`}
                        onClick={() => {
                          window.open(
                            'https://docs.google.com/forms/d/e/1FAIpQLSf-9vbM4Qj9xkiwN07N3lZuDxi407cNFx--OGWLxqp8YDOtCg/viewform',
                            '_blank',
                          );
                        }}
                      >
                        {t('Sign up')}
                      </button>

                      <button
                        className={`rounded-md border border-neutral-600 px-4 py-2 text-sm text-gray-800 hover:bg-gray-200 dark:text-gray-100 dark:hover:bg-transparent`}
                        onClick={() => {
                          window.open(
                            'https://meet.google.com/oyh-hzir-qdq',
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
