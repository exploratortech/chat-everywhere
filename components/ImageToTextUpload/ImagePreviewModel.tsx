/* eslint-disable @next/next/no-img-element */
import { Dialog, Transition } from '@headlessui/react';
import { IconX } from '@tabler/icons-react';
import React, { Dispatch, Fragment, createContext } from 'react';
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
              <Dialog.Panel className="p-4 w-full max-w-[1150px] tablet:max-w-[90vw] h-[calc(100vh-100px)] transform overflow-hidden rounded-2xl  text-left align-middle shadow-xl transition-all bg-neutral-800 text-neutral-200 flex flex-col mobile:h-[100dvh] max-h-[750px] tablet:max-h-[unset] mobile:!max-w-[unset] mobile:!rounded-none">
                <h1 className="my-4 bold text-xl">{t('Image preview')}</h1>
                <div className="flex items-center justify-center w-full h-full border border-gray-400">
                  <img src={preview} alt="" className="h-full object-contain" />
                </div>
                <div className="flex h-max items-center gap-2 justify-center">
                  <button
                    type="button"
                    className="w-full px-4 py-2 mt-6 border rounded-lg shadow  focus:outline-none border-neutral-800 border-opacity-50 bg-white text-black hover:bg-neutral-300"
                    onClick={() => {
                      onClose();
                    }}
                  >
                    {t('Confirm')}
                  </button>
                  <button
                    type="button"
                    className="w-full px-4 py-2 mt-6 border rounded-lg shadow  focus:outline-none border-neutral-800 border-opacity-50 bg-transparent text-white hover:bg-neutral-300 hover:text-black"
                    onClick={() => {
                      onConfirm();
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
