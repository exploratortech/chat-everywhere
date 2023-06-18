import { Dialog, Transition } from '@headlessui/react';
import { Auth, UpdatePassword } from '@supabase/auth-ui-react';
import { FC, Fragment, useContext } from 'react';

import { useTranslation } from 'next-i18next';

import HomeContext from '@/pages/api/home/home.context';

import { ThemeSupa } from '@supabase/auth-ui-shared';
import { SupabaseClient } from '@supabase/supabase-js';

type Props = {
  onClose: () => void;
  supabase: SupabaseClient;
};

export const AuthModel: FC<Props> = ({ onClose, supabase }) => {
  const { t } = useTranslation('auth');
  const {
    state: { user },
  } = useContext(HomeContext);

  const authLabels = {
    sign_up: {
      email_label: t('Email address'),
      password_label: t('Create a Password'),
      email_input_placeholder: t('Your email address'),
      password_input_placeholder: t('Your password'),
      button_label: t('Sign up'),
      loading_button_label: t('Signing up ...'),
      link_text: t("Don't have an account? Sign up"),
      confirmation_text: t('Check your email for the confirmation link'),
    },
    sign_in: {
      email_label: t('Email address'),
      password_label: t('Your Password'),
      email_input_placeholder: t('Your email address'),
      password_input_placeholder: t('Your password'),
      button_label: t('Sign in'),
      loading_button_label: t('Signing in ...'),
      link_text: t('Already have an account? Sign in'),
    },
    forgotten_password: {
      email_label: t('Email address'),
      password_label: t('Your Password'),
      email_input_placeholder: t('Your email address'),
      button_label: t('Send reset password instructions'),
      loading_button_label: t('Sending reset instructions ...'),
      link_text: t('Forgot your password?'),
      confirmation_text: t('Check your email for the password reset link'),
    },
    update_password: {
      password_label: t('New password'),
      password_input_placeholder: t('Your new password'),
      button_label: t('Update password'),
      loading_button_label: t('Updating password ...'),
      confirmation_text: t('Your password has been updated'),
    },
  };

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
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all bg-neutral-800 text-neutral-200">
                {!user && (
                  <>
                    <div>
                      📣{' '}
                      {t(
                        'Sign up to get access to all the amazing features of Chat Everywhere!',
                      )}
                    </div>
                    <Auth
                      supabaseClient={supabase}
                      appearance={{
                        theme: ThemeSupa,
                      }}
                      providers={[]}
                      theme="dark"
                      localization={{
                        variables: {
                          ...authLabels,
                        },
                      }}
                    />
                    <div className="text-xs text-neutral-400 text-center">
                      {t('By signing up, you agree to our ')}
                      <a
                        href="https://intro.chateverywhere.app/terms-of-service.html"
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        {t('Terms of Service.')}
                      </a>
                    </div>
                  </>
                )}

                {user && (
                  <UpdatePassword
                    supabaseClient={supabase}
                    appearance={{
                      theme: ThemeSupa,
                      style:{
                        input: {
                          color: 'white',
                        }
                      }
                    }}
                    theme='dark'
                    localization={{
                      variables: {
                        ...authLabels,
                      },
                    }}
                  />
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
