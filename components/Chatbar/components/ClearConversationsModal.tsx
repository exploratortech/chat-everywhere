import { Dialog, Transition } from '@headlessui/react';
import {
  IconCaretDown,
  IconCaretRight,
  IconFolder,
  IconMessage,
} from '@tabler/icons-react';
import React, { Fragment, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import HomeContext from '@/components/home/home.context';
import { Button } from '@/components/v2Chat/ui/button';
import { getNonDeletedCollection } from '@/utils/app/conversation';
import { FolderInterface } from '@/types/folder';
import { Conversation } from '@/types/chat';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ClearConversationsModal({ open, onClose }: Props) {
  const {
    state: {
      folders,
      conversations,
    },
  } = useContext(HomeContext);

  const { t } = useTranslation('model');

  const filteredFolders = useMemo(() =>
    getNonDeletedCollection(folders),
    [folders],
  );
  const filteredConversations = useMemo(() =>
    getNonDeletedCollection(conversations),
    [conversations],
  );

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
              <Dialog.Panel className="flex flex-col w-full max-w-[70vw] xl:max-w-3xl tablet:max-w-[90vw] h-[calc(80vh-100px)] transform overflow-hidden rounded-2xl text-left align-middle shadow-xl transition-all text-neutral-200 mobile:h-[100dvh] max-h-[750px] tablet:max-h-[unset] mobile:!max-w-[unset] mobile:!rounded-none bg-neutral-900">
                <h1 className="font-bold mb-4 px-6 pt-6">{t('Clear Conversations')}</h1>
                <div className="flex flex-col px-6 overflow-y-auto">
                  {filteredFolders.map((folder) => (
                    <FolderItem
                      key={folder.id}
                      folder={folder}
                      conversations={
                        filteredConversations
                          .filter((conversation: Conversation) => conversation.folderId === folder.id)
                      }
                    />
                  ))}
                  {filteredConversations
                    .filter((conversation: Conversation) => !conversation.folderId)
                    .map((conversation) => (
                      <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                      />
                    ))
                  }
                </div>
                <div className="flex flex-row justify-end p-6 gap-x-2 bg-neutral-900">
                  <Button
                    className="h-10"
                    variant="outline"
                    type="button"
                    onClick={onClose}
                  >
                    {t('Cancel')}
                  </Button>
                  <Button
                    className="h-10"
                    variant="default"
                    type="button"
                  >
                    {t('Delete')} {'(1)'}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

type FolderItemProp = {
  folder: FolderInterface;
  conversations: Conversation[];
}

function FolderItem({ folder, conversations }: FolderItemProp) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <CheckboxItem>
        <div
          className={`flex cursor-pointer w-full items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:!bg-[#343541]/90`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <IconFolder size={18} />
          <div className="relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all text-left text-[12.5px] leading-4 pr-12 select-none">
            {folder.name}
          </div>
          {isOpen ? (
            <IconCaretDown size={18} />
          ) : (
            <IconCaretRight size={18} />
          )}
        </div>
      </CheckboxItem>
      {isOpen && conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
        />
      ))}
    </>
  );
}

type ConversationItemProp = {
  conversation: Conversation;
}

function ConversationItem({ conversation }: ConversationItemProp) {
  return (
    <CheckboxItem padded={!!conversation.folderId}>
      <div className={`flex w-full items-center gap-3 rounded-lg p-3 text-sm translate-x-0`}>
        <IconMessage size={18} />
        <div className="relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all text-left text-[12.5px] leading-4 pr-12">
          {conversation.name}
        </div>
      </div>
    </CheckboxItem>
  );
}

type CheckboxItemProps = {
  checked?: boolean;
  onCheck?: (value: boolean) => void;
  padded?: boolean;
} & PropsWithChildren;

function CheckboxItem({
  children,
  checked: defaultChecked,
  onCheck,
  padded = false,
}: CheckboxItemProps) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(!!defaultChecked);
  }, [defaultChecked]);

  useEffect(() => {
    onCheck && onCheck(checked);
  }, [checked, onCheck])

  return (
    <div className="flex flex-row items-center">
      {padded && (<div className="w-[1px] h-full ml-5 dark:bg-white/50" />)}
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
