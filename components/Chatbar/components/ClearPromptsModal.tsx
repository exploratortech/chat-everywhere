import { Dialog, Transition } from '@headlessui/react';
import { IconFolder, IconMessage, IconX } from '@tabler/icons-react';
import React, {
  Fragment,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { event } from 'nextjs-google-analytics';

import { ActionType, useCreateReducer } from '@/hooks/useCreateReducer';

import { getNonDeletedCollection, savePrompts } from '@/utils/app/conversation';
import { trackEvent } from '@/utils/app/eventTracking';
import { saveFolders } from '@/utils/app/folders';

import { FolderInterface } from '@/types/folder';
import { Prompt } from '@/types/prompt';

import HomeContext from '@/components/home/home.context';
import { Button } from '@/components/v2Chat/ui/button';

interface ClearPromptsModalState {
  selectedPrompts: Set<string>;
  selectedFolders: Set<string>;
  deletingFolders: boolean;
  selectingAll: boolean;
  confirmingDeletion: boolean;
}

const ClearPromptsModalContext = React.createContext<{
  state: ClearPromptsModalState;
  dispatch: React.Dispatch<ActionType<ClearPromptsModalState>>;
  addPrompts: (...ids: string[]) => void;
  removePrompts: (...ids: string[]) => void;
  addFolders: (...ids: string[]) => void;
  removeFolders: (...ids: string[]) => void;
}>({
  state: {
    selectedPrompts: new Set(),
    selectedFolders: new Set(),
    deletingFolders: true,
    selectingAll: false,
    confirmingDeletion: false,
  },
  dispatch: () => {},
  addPrompts: () => {},
  removePrompts: () => {},
  addFolders: () => {},
  removeFolders: () => {},
});

export default function ClearPromptsModal() {
  const {
    state: { folders, prompts, showClearPromptsModal },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const context = useCreateReducer<ClearPromptsModalState>({
    initialState: {
      selectedPrompts: new Set<string>(),
      selectedFolders: new Set<string>(),
      deletingFolders: true,
      selectingAll: false,
      confirmingDeletion: false,
    },
  });

  const {
    state: {
      selectedPrompts,
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
        (folder) => folder.type === 'prompt',
      ),
    [folders],
  );

  const filteredPrompts = useMemo(
    () => getNonDeletedCollection(prompts),
    [prompts],
  );

  const itemCount = useMemo(
    () =>
      deletingFolders
        ? selectedPrompts.size + selectedFolders.size
        : selectedPrompts.size,
    [deletingFolders, selectedPrompts, selectedFolders],
  );

  const addPrompts = useCallback(
    (...ids: string[]) => {
      const updatedSet = new Set<string>(selectedPrompts);
      ids.forEach((id) => updatedSet.add(id));
      dispatch({ field: 'selectedPrompts', value: updatedSet });
    },
    [selectedPrompts, dispatch],
  );

  const removePrompts = useCallback(
    (...ids: string[]) => {
      const updatedSet = new Set<string>(selectedPrompts);
      ids.forEach((id) => updatedSet.delete(id));
      dispatch({ field: 'selectedPrompts', value: updatedSet });
    },
    [selectedPrompts, dispatch],
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
      const promptIds = filteredPrompts.map((prompt) => prompt.id);
      const folderIds = filteredFolders.map((folder) => folder.id);
      if (checked) {
        addPrompts(...promptIds);
        addFolders(...folderIds);
      } else {
        removePrompts(...promptIds);
        removeFolders(...folderIds);
      }
      dispatch({ field: 'selectingAll', value: checked });
      dispatch({ field: 'confirmingDeletion', value: false });
    },
    [
      filteredPrompts,
      filteredFolders,
      addPrompts,
      removePrompts,
      addFolders,
      removeFolders,
      dispatch,
    ],
  );

  const handleClose = useCallback(() => {
    homeDispatch({ field: 'showClearPromptsModal', value: false });

    // Reset state
    setTimeout(() => {
      dispatch({ field: 'selectedPrompts', value: new Set() });
      dispatch({ field: 'selectedFolders', value: new Set() });
      dispatch({ field: 'deletingFolders', value: true });
      dispatch({ field: 'selectingAll', value: false });
      dispatch({ field: 'confirmingDeletion', value: false });
    }, 300);
  }, [homeDispatch, dispatch]);

  const clearPrompts = () => {
    const updatedPrompts = filteredPrompts.filter(
      (prompt) => !selectedPrompts.has(prompt.id),
    );
    homeDispatch({ field: 'prompts', value: updatedPrompts });
    savePrompts(updatedPrompts);

    if (deletingFolders) {
      const updatedFolders = folders.filter(
        (folder) => !selectedFolders.has(folder.id),
      );
      homeDispatch({ field: 'folders', value: updatedFolders });
      saveFolders(updatedFolders);
    }

    homeDispatch({ field: 'forceSyncConversation', value: true });
    homeDispatch({ field: 'replaceRemoteData', value: true });
    event('interaction', {
      category: 'Prompt',
      label: 'Clear prompts',
    });
    trackEvent('Clear prompts clicked');

    handleClose();
  };
  const handleSwitchToClearConversations = () => {
    homeDispatch({
      field: 'showClearPromptsModal',
      value: false,
    });
    homeDispatch({ field: 'showClearConversationsModal', value: true });
  };

  return (
    <Transition appear show={showClearPromptsModal} as={Fragment}>
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

        <ClearPromptsModalContext.Provider
          value={{
            ...context,
            addPrompts,
            removePrompts,
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
                <Dialog.Panel className="flex flex-col w-full max-w-[70vw] xl:max-w-3xl tablet:max-w-[90vw] h-[calc(80vh-100px)] transform overflow-hidden rounded-2xl text-left align-middle shadow-xl transition-all text-neutral-200 mobile:h-[100dvh] max-h-[750px] tablet:max-h-[unset] mobile:!max-w-[unset] mobile:!rounded-none bg-neutral-900">
                  <div className="flex gap-2 items-baseline">
                    <h1 className="font-bold mb-4 px-6 pt-6 pr-2">
                      {t('Clear Prompts')}
                    </h1>
                    <Button
                      variant={'link'}
                      size={'sm'}
                      className="mobile:hidden p-0 text-gray-400 underline"
                      onClick={handleSwitchToClearConversations}
                    >
                      {t('Switch to Clear Conversations')}
                    </Button>
                  </div>

                  <Button
                    className="p-1 absolute top-5 right-5"
                    onClick={handleClose}
                    variant="ghost"
                    type="button"
                  >
                    <IconX />
                  </Button>
                  <div className="relative flex-1 flex flex-col px-6 overflow-y-auto">
                    <div className="flex justify-end self-stretch sticky top-0 py-2 bg-neutral-900 z-[1000]">
                      <div className="flex items-center">
                        <label
                          className="select-none"
                          htmlFor="clear-prompt-all-input"
                        >
                          {t('Select all')}
                        </label>
                        <input
                          className="form-checkbox w-5 h-5 ml-4 rounded-md text-indigo-400 focus:ring-indigo-400 dark:ring-offset-gray-800 focus:ring-2 bg-[#343541]"
                          onChange={(event) =>
                            handleSelectAll(event.currentTarget.checked)
                          }
                          checked={selectingAll}
                          id="clear-prompt-all-input"
                          type="checkbox"
                        />
                      </div>
                    </div>
                    {filteredFolders.map((folder) => (
                      <FolderItem
                        key={folder.id}
                        folder={folder}
                        prompts={filteredPrompts.filter(
                          (prompt: Prompt) => prompt.folderId === folder.id,
                        )}
                      />
                    ))}
                    {filteredPrompts
                      .filter((prompt: Prompt) => !prompt.folderId)
                      .map((prompt) => (
                        <PromptItem key={prompt.id} prompt={prompt} />
                      ))}
                  </div>
                  <div className="flex flex-col items-stretch xs:flex-row justify-between p-6 gap-x-2 gap-y-4 bg-neutral-900">
                    <div className="flex items-center">
                      <label htmlFor="clear-folders-checkbox">
                        {t('Clear folders')}
                      </label>
                      <input
                        id="clear-folders-checkbox"
                        className="form-checkbox w-5 h-5 ml-4 rounded-md text-indigo-400 focus:ring-indigo-400 dark:ring-offset-gray-800 focus:ring-2 bg-[#343541]"
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
                        className="flex-1 xs:flex-auto h-10"
                        variant="outline"
                        type="button"
                        onClick={handleClose}
                      >
                        {t('Cancel')}
                      </Button>
                      {confirmingDeletion ? (
                        <Button
                          className="flex-1 xs:flex-auto h-10"
                          onClick={clearPrompts}
                          variant="default"
                          type="button"
                        >
                          {t('Are you sure?')}
                        </Button>
                      ) : (
                        <Button
                          className="flex-1 xs:flex-auto h-10"
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
        </ClearPromptsModalContext.Provider>
      </Dialog>
    </Transition>
  );
}

type FolderItemProp = {
  folder: FolderInterface;
  prompts: Prompt[];
};

function FolderItem({ folder, prompts }: FolderItemProp) {
  const {
    state: { selectedFolders },
    dispatch,
    addPrompts,
    removePrompts,
    addFolders,
    removeFolders,
  } = useContext(ClearPromptsModalContext);

  const [isOpen, setIsOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  const promptIds = useMemo(
    () => prompts.map((prompt) => prompt.id),
    [prompts],
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
            addPrompts(...promptIds);
            addFolders(folder.id);
          } else {
            removePrompts(...promptIds);
            removeFolders(folder.id);
          }
          dispatch({ field: 'selectingAll', value: false });
          dispatch({ field: 'confirmingDeletion', value: false });
        }}
      >
        <div
          className={`flex cursor-pointer w-full items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:!bg-[#343541]/90`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <IconFolder size={18} />
          <div className="relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all text-left text-[12.5px] leading-4 pr-12 select-none">
            {folder.name}
          </div>
        </div>
      </CheckboxItem>
      {isOpen &&
        prompts.map((prompt) => <PromptItem key={prompt.id} prompt={prompt} />)}
    </>
  );
}

type PromptItemProp = {
  prompt: Prompt;
};

function PromptItem({ prompt }: PromptItemProp) {
  const {
    state: { selectedPrompts },
    dispatch,
    addPrompts,
    removePrompts,
  } = useContext(ClearPromptsModalContext);

  return (
    <CheckboxItem
      padded={!!prompt.folderId}
      checked={selectedPrompts.has(prompt.id)}
      onCheck={(checked: boolean) => {
        checked ? addPrompts(prompt.id) : removePrompts(prompt.id);
        dispatch({ field: 'selectingAll', value: false });
        dispatch({ field: 'confirmingDeletion', value: false });
      }}
    >
      <div
        className={`flex w-full items-center gap-3 rounded-lg p-3 text-sm translate-x-0`}
      >
        <IconMessage size={18} />
        <div className="relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all text-left text-[12.5px] leading-4 pr-12">
          {prompt.name}
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
      {padded && <div className="w-[1px] h-full ml-5 dark:bg-white/50" />}
      {children}
      <input
        className="form-checkbox w-5 h-5 ml-4 rounded-md text-indigo-400 focus:ring-indigo-400 dark:ring-offset-gray-800 focus:ring-2 bg-[#343541]"
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
