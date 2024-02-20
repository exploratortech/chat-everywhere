import { Dialog, Transition } from '@headlessui/react';
import {
  IconCaretDown,
  IconCaretRight,
  IconFolder,
  IconMessage,
} from '@tabler/icons-react';
import React, { Fragment, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import HomeContext from '@/components/home/home.context';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ClearConversationsModal({ open, onClose }: Props) {
  const {
  } = useContext(HomeContext);

  const { t } = useTranslation('model');

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={onClose}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500/50" />
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
              <Dialog.Panel className="w-full max-w-[70vw] xl:max-w-3xl tablet:max-w-[90vw] h-[calc(80vh-100px)] transform overflow-hidden rounded-2xl text-left align-middle shadow-xl transition-all bg-neutral-800 text-neutral-200 flex mobile:h-[100dvh] max-h-[750px] tablet:max-h-[unset] mobile:!max-w-[unset] mobile:!rounded-none">
                <div className="relative flex flex-col flex-grow p-6 bg-neutral-900 overflow-y-auto">
                  <h1 className="font-bold mb-4">{t('Clear Conversations')}</h1>
                  <FolderItem />
                  <ConversationItem />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function FolderItem() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CheckboxItem>
      <div
        className={`flex cursor-pointer w-full items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:!bg-[#343541]/90`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <IconFolder size={18} />
        <div className="relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all text-left text-[12.5px] leading-4 pr-12 select-none">
          Test Folder
        </div>
        {isOpen ? (
          <IconCaretDown size={18} />
        ) : (
          <IconCaretRight size={18} />
        )}
      </div>
    </CheckboxItem>
  );
}

function ConversationItem() {
  return (
    <CheckboxItem>
      <div className={`flex w-full items-center gap-3 rounded-lg p-3 text-sm translate-x-0`}>
        <IconMessage size={18} />
        <div className="relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all text-left text-[12.5px] leading-4 pr-12">
          Test Conversation
        </div>
      </div>
    </CheckboxItem>
  );
}

type CheckboxProps = {
  checked?: boolean;
  onCheck?: (value: boolean) => void;
} & PropsWithChildren;

function CheckboxItem({ children, checked: defaultChecked, onCheck }: CheckboxProps) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(!!defaultChecked);
  }, [defaultChecked]);

  useEffect(() => {
    onCheck && onCheck(checked);
  }, [checked, onCheck])

  return (
    <div className="flex flex-row items-center">
      {children}
      <input
        className="w-5 h-5 ml-4 rounded-md text-indigo-400 focus:ring-indigo-400 dark:ring-offset-gray-800 focus:ring-2 bg-[#343541]"
        onChange={() => setChecked(!checked)}
        checked={checked}
        type="checkbox"
      />
    </div>
  );
}
