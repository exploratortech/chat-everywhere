import { Dialog, Transition } from '@headlessui/react';
import { IconX } from '@tabler/icons-react';
import React, { Dispatch, Fragment, createContext, useContext } from 'react';

import { ActionType, useCreateReducer } from '@/hooks/useCreateReducer';

import HomeContext from '@/pages/api/home/home.context';

import OneTimeCodeGeneration from '../OneTimeCodeGeneration';
import SharedMessages from './SharedMessages';
import Sidebar from './Sidebar';

type Props = {
  onClose: () => void;
};

const portalState = {
  showing: 'one-time-code' as 'one-time-code' | 'shared-message',
};

interface PortalState {
  state: typeof portalState;
  dispatch: Dispatch<ActionType<typeof portalState>>;
  closeModel: () => void;
}

export const TeacherPortalContext = createContext<PortalState>(undefined!);
export default function SettingsModel({ onClose }: Props) {
  const PortalState = useCreateReducer({
    initialState: portalState,
  });
  const {
    state: { showing },
  } = PortalState;
  const {
    state: { user, isPaidUser },
  } = useContext(HomeContext);

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose} open>
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

        <TeacherPortalContext.Provider
          value={{ ...PortalState, closeModel: onClose }}
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
                <Dialog.Panel className="w-full max-w-[90vw] tablet:max-w-[90vw] h-[calc(80vh-100px)] transform overflow-hidden rounded-2xl text-left align-middle shadow-xl transition-all bg-neutral-800 text-neutral-200 flex mobile:h-[100dvh] max-h-[90dvh] tablet:max-h-[unset] mobile:!max-w-[unset] mobile:!rounded-none">
                  <Sidebar className="bg-neutral-800 flex-shrink-0 flex-grow-0" />
                  <div className="p-6 bg-neutral-900 flex-grow relative overflow-y-auto">
                    {showing === 'one-time-code' && <OneTimeCodeGeneration />}
                    {showing === 'shared-message' && <SharedMessages />}
                    <button
                      className="w-max min-h-[34px] p-4 absolute top-0 right-0"
                      onClick={onClose}
                    >
                      <IconX />
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </TeacherPortalContext.Provider>
      </Dialog>
    </Transition>
  );
}
