import {
  IconFileCode,
  IconLogin,
  IconLogout,
  IconSettings,
  IconUser,
} from '@tabler/icons-react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { trackEvent } from '@/utils/app/eventTracking';

import HomeContext from '@/pages/api/home/home.context';

import UserAccountBadge from '../UserAccountBadge';
import { SettingsModelContext } from './SettingsModel';

type Props = {
  className?: string;
};

export default function Sidebar({ className = '' }: Props) {
  const {
    state: { showing },
    dispatch,
    closeModel,
  } = useContext(SettingsModelContext);
  const {
    state: { user },
    dispatch: homeDispatch,
    handleUserLogout,
  } = useContext(HomeContext);
  const { t } = useTranslation('model');
  const items = [
    {
      icon: <IconUser height={18} />,
      name: t('Account'),
      value: 'account',
      suffixIcon: <UserAccountBadge />,
      callback: () => {
        trackEvent('Account button clicked');
        dispatch({
          field: 'showing',
          value: 'account',
        });
      },
    },
    {
      icon: <IconSettings height={18} />,
      name: t('App'),
      value: 'app',
      callback: () =>
        dispatch({
          field: 'showing',
          value: 'app',
        }),
    },
    {
      icon: <IconFileCode height={18} />,
      name: t('Data'),
      value: 'data',
      callback: () =>
        dispatch({
          field: 'showing',
          value: 'data',
        }),
    },
  ];

  return (
    <div className={`${className} flex justify-between flex-col`}>
      <div>
        <b className="pt-6 px-6 block select-none">{t('Settings')}</b>
        <div className="py-6 flex flex-col">
          {items.map((item, i) => {
            return (
              <a
                key={`${i} ${item.name}`}
                href="#"
                className={`outline-none py-2 px-6 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 ${
                  item.suffixIcon ? 'flex items-center justify-between' : ''
                } ${
                  showing === item.value
                    ? 'bg-neutral-900 text-neutral-100'
                    : ''
                }
                `}
                onClick={item.callback}
              >
                <div className="flex gap-2 items-center">
                  {item.icon} {item.name}
                </div>
                {!!item.suffixIcon && item.suffixIcon}
              </a>
            );
          })}
        </div>
      </div>

      <a
        href="#"
        className="outline-none py-5 px-6 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 flex gap-2 items-center"
        onClick={() => {
          closeModel();
          if (user) {
            handleUserLogout();
          } else {
            homeDispatch({
              field: 'showLoginSignUpModel',
              value: true,
            });
          }
        }}
      >
        {user ? <IconLogout height={18} /> : <IconLogin height={18} />}
        <div> {user ? t('Sign out') : t('Sign in')}</div>
      </a>
    </div>
  );
}
