import { Dialog, Transition } from '@headlessui/react';
import { IconX } from '@tabler/icons-react';
import type { Dispatch } from 'react';
import React, { Fragment, createContext, useContext } from 'react';

import type { ActionType } from '@/hooks/useCreateReducer';
import { useCreateReducer } from '@/hooks/useCreateReducer';

import HomeContext from '@/components/home/home.context';

import Settings_Account from './Settings_Account';
import Settings_App from './Settings_App';
import Settings_Data from './Settings_Data';
import Settings_MQTT from './Settings_MQTT';
import Sidebar from './Sidebar';

type Props = {
  onClose: () => void;
};

const settingsState = {
  showing: 'account' as 'account' | 'app' | 'data' | 'mqtt',
};

interface SettingsContext {
  state: typeof settingsState;
  dispatch: Dispatch<ActionType<typeof settingsState>>;
  closeModel: () => void;
}

export const SettingsModelContext = createContext<SettingsContext>(undefined!);
export default function SettingsModel({ onClose }: Props) {
  const settingsContext = useCreateReducer({
    initialState: settingsState,
  });
  const {
    state: { showing },
  } = settingsContext;
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

        <SettingsModelContext.Provider
          value={{ ...settingsContext, closeModel: onClose }}
        >
          <div
            className="fixed inset-0 overflow-y-auto"
            data-cy="chatbar-settings-modal"
          >
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
                <Dialog.Panel className="flex h-[calc(80vh-100px)] max-h-[750px] w-full max-w-[80vw] transform overflow-hidden rounded-2xl bg-neutral-800 text-left align-middle text-neutral-200 shadow-xl transition-all xl:max-w-3xl mobile:h-dvh mobile:!max-w-[unset] mobile:!rounded-none tablet:max-h-[unset] tablet:max-w-[90vw]">
                  <Sidebar
                    className="shrink-0 grow-0 bg-neutral-800"
                    disableFooterItems={!user || !isPaidUser}
                  />
                  <div className="relative grow overflow-y-auto bg-neutral-900 p-6">
                    {showing === 'account' && <Settings_Account />}
                    {showing === 'app' && <Settings_App />}
                    {showing === 'data' && <Settings_Data />}
                    {showing === 'mqtt' && <Settings_MQTT />}
                    <button
                      className="absolute right-0 top-0 min-h-[34px] w-max p-4"
                      onClick={onClose}
                    >
                      <IconX />
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </SettingsModelContext.Provider>
      </Dialog>
    </Transition>
  );
}
