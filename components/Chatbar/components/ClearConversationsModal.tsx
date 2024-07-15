import { Dialog, Transition } from '@headlessui/react';
import {
  IconCaretDown,
  IconCaretRight,
  IconFolder,
  IconMessage,
  IconX,
} from '@tabler/icons-react';
import type { PropsWithChildren } from 'react';
import React, {
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { event } from 'nextjs-google-analytics';

import { useCreateReducer } from '@/hooks/useCreateReducer';

import { newDefaultConversation } from '@/utils/app/const';
import {
  getNonDeletedCollection,
  saveConversations,
  updateConversationLastUpdatedAtTimeStamp,
} from '@/utils/app/conversation';
import { trackEvent } from '@/utils/app/eventTracking';
import { saveFolders } from '@/utils/app/folders';

import type { Conversation } from '@/types/chat';
import type { FolderInterface } from '@/types/folder';

import HomeContext from '@/components/home/home.context';
import { Button } from '@/components/v2Chat/ui/button';

import type { ClearConversationsModalState } from './ClearConversationsModal.context';
import ClearConversationsModalContext from './ClearConversationsModal.context';

export default function ClearConversationsModal() {
  const {
    state: {
      defaultModelId,
      folders,
      conversations,
      showClearConversationsModal,
    },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const context = useCreateReducer<ClearConversationsModalState>({
    initialState: {
      selectedConversations: new Set<string>(),
      selectedFolders: new Set<string>(),
      deletingFolders: true,
      selectingAll: false,
      confirmingDeletion: false,
    },
  });

  const {
    state: {
      selectedConversations,
      selectedFolders,
      deletingFolders,
      selectingAll,
      confirmingDeletion,
    },
    dispatch,
  } = context;

  const { t } = useTranslation('model');

  const filteredFolders = useMemo(
    () =>
      getNonDeletedCollection(folders).filter(
        (folder) => folder.type === 'chat',
      ),
    [folders],
  );

  const filteredConversations = useMemo(
    () => getNonDeletedCollection(conversations),
    [conversations],
  );

  const itemCount = useMemo(
    () =>
      deletingFolders
        ? selectedConversations.size + selectedFolders.size
        : selectedConversations.size,
    [deletingFolders, selectedConversations, selectedFolders],
  );

  const addConversations = useCallback(
    (...ids: string[]) => {
      const updatedSet = new Set<string>(selectedConversations);
      ids.forEach((id) => updatedSet.add(id));
      dispatch({ field: 'selectedConversations', value: updatedSet });
    },
    [selectedConversations, dispatch],
  );

  const removeConversations = useCallback(
    (...ids: string[]) => {
      const updatedSet = new Set<string>(selectedConversations);
      ids.forEach((id) => updatedSet.delete(id));
      dispatch({ field: 'selectedConversations', value: updatedSet });
    },
    [selectedConversations, dispatch],
  );

  const addFolders = useCallback(
    (...ids: string[]) => {
      const updatedSet = new Set<string>(selectedFolders);
      ids.forEach((id) => updatedSet.add(id));
      dispatch({ field: 'selectedFolders', value: updatedSet });
    },
    [selectedFolders, dispatch],
  );

  const removeFolders = useCallback(
    (...ids: string[]) => {
      const updatedSet = new Set<string>(selectedFolders);
      ids.forEach((id) => updatedSet.delete(id));
      dispatch({ field: 'selectedFolders', value: updatedSet });
    },
    [selectedFolders, dispatch],
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      const conversationIds = filteredConversations.map(
        (conversation) => conversation.id,
      );
      const folderIds = filteredFolders.map((folder) => folder.id);
      if (checked) {
        addConversations(...conversationIds);
        addFolders(...folderIds);
      } else {
        removeConversations(...conversationIds);
        removeFolders(...folderIds);
      }
      dispatch({ field: 'selectingAll', value: checked });
      dispatch({ field: 'confirmingDeletion', value: false });
    },
    [
      filteredConversations,
      filteredFolders,
      addConversations,
      removeConversations,
      addFolders,
      removeFolders,
      dispatch,
    ],
  );

  const handleClose = useCallback(() => {
    homeDispatch({ field: 'showClearConversationsModal', value: false });

    // Reset state
    setTimeout(() => {
      dispatch({ field: 'selectedConversations', value: new Set() });
      dispatch({ field: 'selectedFolders', value: new Set() });
      dispatch({ field: 'deletingFolders', value: true });
      dispatch({ field: 'selectingAll', value: false });
      dispatch({ field: 'confirmingDeletion', value: false });
    }, 300);
  }, [homeDispatch, dispatch]);

  const clearConversations = () => {
    defaultModelId &&
      homeDispatch({
        field: 'selectedConversation',
        value: newDefaultConversation,
      });

    const updatedConversations = filteredConversations.filter(
      (conversation) => !selectedConversations.has(conversation.id),
    );
    homeDispatch({ field: 'conversations', value: updatedConversations });
    saveConversations(updatedConversations);
    localStorage.removeItem('selectedConversation');

    if (deletingFolders) {
      const updatedFolders = folders.filter(
        (folder) => !selectedFolders.has(folder.id),
      );
      homeDispatch({ field: 'folders', value: updatedFolders });
      saveFolders(updatedFolders);
    }

    updateConversationLastUpdatedAtTimeStamp();

    homeDispatch({ field: 'forceSyncConversation', value: true });
    homeDispatch({ field: 'replaceRemoteData', value: true });

    event('interaction', {
      category: 'Conversation',
      label: 'Clear conversations',
    });

    trackEvent('Clear conversation clicked');

    handleClose();
  };

  const handleSwitchToClearPrompts = () => {
    homeDispatch({ field: 'showClearConversationsModal', value: false });
    homeDispatch({ field: 'showClearPromptsModal', value: true });
  };
  return (
    <Transition appear show={showClearConversationsModal} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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

        <ClearConversationsModalContext.Provider
          value={{
            ...context,
            addConversations,
            removeConversations,
            addFolders,
            removeFolders,
          }}
        >
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
                <Dialog.Panel className="flex h-[calc(80vh-100px)] max-h-[750px] w-full max-w-[70vw] flex-col overflow-hidden rounded-2xl bg-neutral-900 text-left align-middle text-neutral-200 shadow-xl transition-all xl:max-w-3xl mobile:h-dvh mobile:!max-w-[unset] mobile:!rounded-none tablet:max-h-[unset] tablet:max-w-[90vw]">
                  <div className="flex items-baseline gap-2">
                    <h1 className="mb-4 px-6 pr-2 pt-6 font-bold">
                      {t('Clear Conversations')}
                    </h1>
                    <Button
                      variant={'link'}
                      size={'sm'}
                      className="p-0 text-gray-400 underline mobile:hidden"
                      onClick={handleSwitchToClearPrompts}
                    >
                      {t('Switch to Clear Prompts')}
                    </Button>
                  </div>

                  <Button
                    className="absolute right-5 top-5 p-1"
                    onClick={handleClose}
                    variant="ghost"
                    type="button"
                  >
                    <IconX />
                  </Button>
                  <div className="relative flex flex-1 flex-col overflow-y-auto px-6">
                    <div className="sticky top-0 z-[1000] flex justify-end self-stretch bg-neutral-900 py-2">
                      <div className="flex items-center">
                        <label
                          className="select-none"
                          htmlFor="clear-conversation-all-input"
                        >
                          {t('Select all')}
                        </label>
                        <input
                          className="form-checkbox ml-4 size-5 rounded-md bg-[#343541] text-indigo-400 focus:ring-2 focus:ring-indigo-400 dark:ring-offset-gray-800"
                          onChange={(event) =>
                            handleSelectAll(event.currentTarget.checked)
                          }
                          checked={selectingAll}
                          id="clear-conversation-all-input"
                          type="checkbox"
                        />
                      </div>
                    </div>
                    {filteredFolders.map((folder) => (
                      <FolderItem
                        key={folder.id}
                        folder={folder}
                        conversations={filteredConversations.filter(
                          (conversation: Conversation) =>
                            conversation.folderId === folder.id,
                        )}
                      />
                    ))}
                    {filteredConversations
                      .filter(
                        (conversation: Conversation) => !conversation.folderId,
                      )
                      .map((conversation) => (
                        <ConversationItem
                          key={conversation.id}
                          conversation={conversation}
                        />
                      ))}
                  </div>
                  <div className="flex flex-col items-stretch justify-between gap-x-2 gap-y-4 bg-neutral-900 p-6 xs:flex-row">
                    <div className="flex items-center">
                      <label htmlFor="clear-folders-checkbox">
                        {t('Clear folders')}
                      </label>
                      <input
                        id="clear-folders-checkbox"
                        className="form-checkbox ml-4 size-5 rounded-md bg-[#343541] text-indigo-400 focus:ring-2 focus:ring-indigo-400 dark:ring-offset-gray-800"
                        checked={deletingFolders}
                        onChange={() => {
                          dispatch({
                            field: 'deletingFolders',
                            value: !deletingFolders,
                          });
                          dispatch({
                            field: 'confirmingDeletion',
                            value: false,
                          });
                        }}
                        type="checkbox"
                      />
                    </div>
                    <div className="flex gap-x-2">
                      <Button
                        className="h-10 flex-1 xs:flex-auto"
                        variant="outline"
                        type="button"
                        onClick={handleClose}
                      >
                        {t('Cancel')}
                      </Button>
                      {confirmingDeletion ? (
                        <Button
                          className="h-10 flex-1 xs:flex-auto"
                          onClick={clearConversations}
                          variant="default"
                          type="button"
                        >
                          {t('Are you sure?')}
                        </Button>
                      ) : (
                        <Button
                          className="h-10 flex-1 xs:flex-auto"
                          onClick={() => {
                            dispatch({
                              field: 'confirmingDeletion',
                              value: true,
                            });
                            setTimeout(() => {
                              dispatch({
                                field: 'confirmingDeletion',
                                value: false,
                              });
                            }, 5000);
                          }}
                          variant="default"
                          type="button"
                          disabled={itemCount === 0}
                        >
                          {t('Delete')} {`(${itemCount})`}
                        </Button>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </ClearConversationsModalContext.Provider>
      </Dialog>
    </Transition>
  );
}

type FolderItemProp = {
  folder: FolderInterface;
  conversations: Conversation[];
};

function FolderItem({ folder, conversations }: FolderItemProp) {
  const {
    state: { selectedFolders },
    dispatch,
    addConversations,
    removeConversations,
    addFolders,
    removeFolders,
  } = useContext(ClearConversationsModalContext);

  const [isOpen, setIsOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  const conversationIds = useMemo(
    () => conversations.map((conversation) => conversation.id),
    [conversations],
  );

  useEffect(() => {
    setChecked(selectedFolders.has(folder.id));
  }, [setChecked, selectedFolders, folder]);

  return (
    <>
      <CheckboxItem
        checked={checked}
        onCheck={(checked: boolean) => {
          if (checked) {
            addConversations(...conversationIds);
            addFolders(folder.id);
          } else {
            removeConversations(...conversationIds);
            removeFolders(folder.id);
          }
          dispatch({ field: 'selectingAll', value: false });
          dispatch({ field: 'confirmingDeletion', value: false });
        }}
      >
        <div
          className={`flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:!bg-[#343541]/90`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <IconFolder size={18} />
          <div className="relative max-h-5 flex-1 select-none truncate break-all pr-12 text-left text-[12.5px] leading-4">
            {folder.name}
          </div>
          {isOpen ? <IconCaretDown size={18} /> : <IconCaretRight size={18} />}
        </div>
      </CheckboxItem>
      {isOpen &&
        conversations.map((conversation) => (
          <ConversationItem key={conversation.id} conversation={conversation} />
        ))}
    </>
  );
}

type ConversationItemProp = {
  conversation: Conversation;
};

function ConversationItem({ conversation }: ConversationItemProp) {
  const {
    state: { selectedConversations },
    dispatch,
    addConversations,
    removeConversations,
  } = useContext(ClearConversationsModalContext);

  return (
    <CheckboxItem
      padded={!!conversation.folderId}
      checked={selectedConversations.has(conversation.id)}
      onCheck={(checked: boolean) => {
        checked
          ? addConversations(conversation.id)
          : removeConversations(conversation.id);
        dispatch({ field: 'selectingAll', value: false });
        dispatch({ field: 'confirmingDeletion', value: false });
      }}
    >
      <div
        className={`flex w-full translate-x-0 items-center gap-3 rounded-lg p-3 text-sm`}
      >
        <IconMessage size={18} />
        <div className="relative max-h-5 flex-1 truncate break-all pr-12 text-left text-[12.5px] leading-4">
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
  checked = false,
  onCheck,
  padded = false,
}: CheckboxItemProps) {
  const [isChecked, setIsChecked] = useState(checked);

  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  return (
    <div className="flex flex-row items-center">
      {padded && <div className="ml-5 h-full w-px dark:bg-white/50" />}
      {children}
      <input
        className="form-checkbox ml-4 size-5 rounded-md bg-[#343541] text-indigo-400 focus:ring-2 focus:ring-indigo-400 dark:ring-offset-gray-800"
        onChange={() => {
          setIsChecked(!isChecked);
          onCheck && onCheck(!isChecked);
        }}
        checked={isChecked}
        type="checkbox"
      />
    </div>
  );
}
