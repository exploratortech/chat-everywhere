import { Dialog, Transition } from '@headlessui/react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import React, { Fragment, memo, useState } from 'react';
import toast from 'react-hot-toast';

import { useTranslation } from 'next-i18next';

import Spinner from '../Spinner/Spinner';

import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

type Props = {
  className?: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

async function oneTimeCodeLogin(code: string, uniqueId: string, t: any) {
  const res = await fetch('/api/one-time-code-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, uniqueId }),
  });

  if (res.status !== 200) {
    const data = await res.json();
    if (data.error) {
      toast.error(t(data.error));
      throw new Error(data.error);
    }
    toast.error('An unknown error occurred');
    throw new Error('An unknown error occurred');
  }

  return res.json();
}

const OneTimeCodeLoginModal = memo(
  ({ className = '', open, onOpen, onClose }: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const [code, setCode] = useState('');
    const [uniqueId, setUniqueId] = useState('');
    const { t } = useTranslation('model');
    const { t: authT } = useTranslation('auth');
    const supabase = useSupabaseClient();

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsLoading(true);
      try {
        const res = await oneTimeCodeLogin(code, uniqueId, authT);
        const { randomEmail, randomPassword } = res;
        const { error } = await supabase.auth.signInWithPassword({
          email: randomEmail,
          password: randomPassword,
        });
        if (error) {
          throw error;
        }
        onClose(); // Close the modal on successful login
      } catch (error) {
        console.error(t('Login failed'));
      } finally {
        setIsLoading(false);
      }
    };

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
                <Dialog.Panel className="w-full max-w-3xl tablet:max-w-max h-max transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all bg-neutral-800 text-neutral-200 grid grid-rows-[max-content_1fr] mobile:h-[100dvh] mobile:!max-w-[unset] mobile:!rounded-none">
                  <div
                    className={cn(
                      'invisible',
                      isLoading &&
                        'visible absolute h-full flex justify-center items-center w-full',
                    )}
                  >
                    <Spinner size="16px" className="mx-auto" />
                  </div>
                  <form
                    className={cn(
                      'space-y-6 invisible',
                      !isLoading && 'visible',
                    )}
                    onSubmit={handleLogin}
                  >
                    <div>
                      <label
                        htmlFor="one-time-code"
                        className="block text-sm font-medium text-neutral-200"
                      >
                        {authT('Your one-time code')}
                      </label>
                      <div className="mt-1">
                        <input
                          id="one-time-code"
                          name="one-time-code"
                          type="text"
                          required
                          value={code}
                          onChange={(e) =>
                            setCode(e.target.value.replace(/[^0-9]/g, ''))
                          }
                          className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="unique-id"
                        className="block text-sm font-medium text-neutral-200"
                      >
                        {t('Name')}
                      </label>
                      <div className="mt-1">
                        <input
                          id="unique-id"
                          name="unique-id"
                          type="text"
                          required
                          value={uniqueId}
                          onChange={(e) => setUniqueId(e.target.value)}
                          className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
                        />
                      </div>
                    </div>
                    <div>
                      <button
                        type="submit"
                        className="w-full px-4 py-2 mt-2 border rounded-lg shadow border-neutral-500 text-neutral-900 hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300"
                      >
                        {authT('Sign in')}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  },
);

OneTimeCodeLoginModal.displayName = 'OneTimeCodeLoginModal';

export default OneTimeCodeLoginModal;
