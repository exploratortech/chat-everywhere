import { Dialog, Transition } from '@headlessui/react';
import React, { Fragment, memo, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { StudentMessageSubmission } from '@/types/share-messages-by-teacher-profile';

import SharedMessageItem from './SharedMessageItem';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

type Props = {
  className?: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  submission: StudentMessageSubmission | null;
};

const ZoomInSharedMessageItem = memo(
  ({ className = '', open, onOpen, onClose, submission }: Props) => {
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
                <Dialog.Panel className="w-full max-w-3xl tablet:max-w-max h-max transform overflow-hidden rounded-2xl text-left align-middle shadow-xl transition-all bg-neutral-800 text-neutral-200 grid grid-rows-[max-content_1fr] mobile:h-[100dvh] mobile:!max-w-[unset] mobile:!rounded-none">
                  {submission && <SharedMessageItem submission={submission} />}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  },
);

ZoomInSharedMessageItem.displayName = 'ZoomInSharedMessageItem';

export default ZoomInSharedMessageItem;
