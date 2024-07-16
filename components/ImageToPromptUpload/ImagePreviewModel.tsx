/* eslint-disable @next/next/no-img-element */
import { Dialog, Transition } from '@headlessui/react';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  onClose: () => void;
  onConfirm: () => void;
  preview: string | undefined;
  filename: string;
};

export default function ImagePreviewModel({
  onClose,
  onConfirm,
  preview,
  filename,
}: Props) {
  const { t } = useTranslation('model');
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
              <Dialog.Panel className="flex h-[calc(100vh-100px)] max-h-[750px] w-full max-w-[1150px] flex-col overflow-hidden rounded-2xl  bg-neutral-800 p-4 text-left align-middle text-neutral-200 shadow-xl transition-all mobile:h-dvh mobile:!max-w-[unset] mobile:!rounded-none tablet:max-h-[unset] tablet:max-w-[90vw]">
                <h1 className="my-3 text-xl">{t('Image preview')}</h1>
                <div className="flex items-center justify-center">
                  {filename}
                </div>
                <div className="flex size-full max-h-[50dvh] items-center justify-center border border-gray-400">
                  <img src={preview} alt="" className="h-full object-contain" />
                </div>
                <div className="flex h-max items-center justify-center gap-2">
                  <button
                    type="button"
                    className="mt-6 w-full rounded-lg border border-neutral-800 border-opacity-50 bg-white  px-4 py-2 text-black shadow hover:bg-neutral-300 focus:outline-none"
                    onClick={() => {
                      onConfirm();
                    }}
                  >
                    {t('Confirm')}
                  </button>
                  <button
                    type="button"
                    className="mt-6 w-full rounded-lg border border-neutral-100 bg-transparent px-4  py-2 text-white shadow hover:border-neutral-300 hover:bg-neutral-300 hover:text-black focus:outline-none"
                    onClick={() => {
                      onClose();
                    }}
                  >
                    {t('Cancel')}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
