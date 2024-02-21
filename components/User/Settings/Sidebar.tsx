import {
  IconBuildingBroadcastTower,
  IconFileCode,
  IconLogin,
  IconLogout,
  IconSettings,
  IconUser,
} from '@tabler/icons-react';
import React, { cloneElement, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { trackEvent } from '@/utils/app/eventTracking';

import HomeContext from '@/components/home/home.context';

import { SettingsModelContext } from './SettingsModel';

type Props = {
  className?: string;
  disableFooterItems?: boolean;
};

type sideBarItemType = {
  icon: JSX.Element;
  name: string;
  value: string;
  callback: () => void;
};

export default function Sidebar({
  className = '',
  disableFooterItems = true,
}: Props) {
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
  const items: sideBarItemType[] = [
    {
      icon: <IconUser />,
      name: t('Account'),
      value: 'account',
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
  const footerItems = [
    {
      icon: <IconBuildingBroadcastTower />,
      name: t('MQTT'),
      value: 'mqtt',
      callback: () =>
        dispatch({
          field: 'showing',
          value: 'mqtt',
        }),
    },
  ];

  const getRenderItems = (itemsArray: sideBarItemType[]) =>
    itemsArray.map((item, i) => (
      <a
        key={`${i} ${item.name}`}
        href="#"
        className={`outline-none py-2 px-6 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 tablet:px-2 tablet:py-4 
          ${showing === item.value ? 'bg-neutral-900 text-neutral-100' : ''}
          `}
        onClick={item.callback}
      >
        <div className="flex gap-2 items-center ">
          {cloneElement(item.icon, {
            className: iconClass,
          })}
          <div className="tablet:hidden"> {item.name}</div>
        </div>
      </a>
    ));

  return (
    <div className={`${className} flex justify-between flex-col`}>
      <div>
        <b className="pt-6 px-6 block select-none tablet:hidden">
          {t('Settings')}
        </b>
        <div className="py-6 flex flex-col">{getRenderItems(items)}</div>
      </div>

      <div className="flex flex-col">
        {!disableFooterItems && getRenderItems(footerItems)}
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
    </div>
  );
}
