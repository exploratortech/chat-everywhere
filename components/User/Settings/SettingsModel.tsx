import { Dialog, Transition } from '@headlessui/react';
import { IconX } from '@tabler/icons-react';
import React, {
  Dispatch,
  Fragment,
  createContext,
  useContext,
  useEffect,
} from 'react';

import { ActionType, useCreateReducer } from '@/hooks/useCreateReducer';

import HomeContext from '@/pages/api/home/home.context';

import Settings_Account from './Settings_Account';
import Settings_App from './Settings_App';
import Settings_Data from './Settings_Data';
import Sidebar from './Sidebar';

type Props = {
  onClose: () => void;
};
const settingsState = {
  showing: 'account' as 'account' | 'app' | 'data',
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
    dispatch,
  } = settingsContext;
  const {
    state: { user },
  } = useContext(HomeContext);

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

        <SettingsModelContext.Provider
          value={{ ...settingsContext, closeModel: onClose }}
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
                <Dialog.Panel className=" w-full max-w-[1150px] tablet:max-w-[90vw] h-[calc(100vh-100px)] transform overflow-hidden rounded-2xl  text-left align-middle shadow-xl transition-all bg-neutral-800 text-neutral-200 flex mobile:h-[100dvh] max-h-[750px] tablet:max-h-[unset] mobile:!max-w-[unset] mobile:!rounded-none">
                  <Sidebar className="bg-neutral-800 flex-shrink-0 flex-grow-0" />
                  <div className="p-6 bg-neutral-900 flex-grow relative">
                    {showing === 'account' && <Settings_Account />}
                    {showing === 'app' && <Settings_App />}
                    {showing === 'data' && <Settings_Data />}
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
        </SettingsModelContext.Provider>
      </Dialog>
    </Transition>
  );
}
