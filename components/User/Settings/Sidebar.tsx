import {
  IconFileCode,
  IconLogin,
  IconLogout,
  IconSettings,
  IconUser,
} from '@tabler/icons-react';
import React, { cloneElement, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import useMediaQuery from '@/hooks/useMediaQuery';

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
  const iconClass = 'h-[18px] tablet:h-[22px] tablet:w-[36px]';
  const items = [
    {
      icon: <IconUser />,
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
      icon: <IconSettings />,
      name: t('App'),
      value: 'app',
      callback: () =>
        dispatch({
          field: 'showing',
          value: 'app',
        }),
    },
    {
      icon: <IconFileCode />,
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
        <b className="pt-6 px-6 block select-none tablet:hidden">
          {t('Settings')}
        </b>
        <div className="py-6 flex flex-col">
          {items.map((item, i) => {
            return (
              <a
                key={`${i} ${item.name}`}
                href="#"
                className={`outline-none py-2 px-6 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900  tablet:px-2 tablet:py-4 ${
                  item.suffixIcon
                    ? 'flex gap-4 items-center justify-between'
                    : ''
                } ${
                  showing === item.value
                    ? 'bg-neutral-900 text-neutral-100'
                    : ''
                }
                `}
                onClick={item.callback}
              >
                <div className="flex gap-2 items-center ">
                  {cloneElement(item.icon, {
                    className: iconClass,
                  })}
                  <div className="tablet:hidden"> {item.name}</div>
                </div>
                <div className="tablet:hidden">
                  {!!item.suffixIcon && item.suffixIcon}
                </div>
              </a>
            );
          })}
        </div>
      </div>

      <a
        href="#"
        className="outline-none py-5 px-6 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 flex gap-2 items-center tablet:px-2"
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
        {user ? (
          <IconLogout className={iconClass} />
        ) : (
          <IconLogin className={iconClass} />
        )}
        <div className="tablet:hidden">
          {user ? t('Sign out') : t('Sign in')}
        </div>
      </a>
    </div>
  );
}
