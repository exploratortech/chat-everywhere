import {
  IconBuildingBroadcastTower,
  IconFileCode,
  IconLogin,
  IconLogout,
  IconSettings,
  IconUser,
} from '@tabler/icons-react';
import React, { cloneElement, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

import useLogoutHook from '@/hooks/useLogoutHook';

import { trackEvent } from '@/utils/app/eventTracking';

import { LogoutClearBrowserDialog } from '@/components/LogoutClearBrowserDialog';
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
  } = useContext(HomeContext);

  const { handleUserLogout } = useLogoutHook();
  const { t } = useTranslation('model');
  const [open, setOpen] = useState<boolean>(false);
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
        className={`px-6 py-2 text-neutral-400 outline-none hover:bg-neutral-900 hover:text-neutral-200 tablet:px-2 tablet:py-4
          ${showing === item.value ? 'bg-neutral-900 text-neutral-100' : ''}
          `}
        onClick={item.callback}
      >
        <div className="flex items-center gap-2 ">
          {cloneElement(item.icon, {
            className: iconClass,
          })}
          <div className="tablet:hidden"> {item.name}</div>
        </div>
      </a>
    ));

  return (
    <div className={`${className} flex flex-col justify-between`}>
      <div>
        <b className="block select-none px-6 pt-6 tablet:hidden">
          {t('Settings')}
        </b>
        <div className="flex flex-col py-6">{getRenderItems(items)}</div>
      </div>

      <div className="flex flex-col">
        {!disableFooterItems && getRenderItems(footerItems)}
        <a
          href="#"
          className="flex items-center gap-2 px-6 py-5 text-neutral-400 outline-none hover:bg-neutral-900 hover:text-neutral-200 tablet:px-2"
          data-cy="sign-out-confirmation-button"
          onClick={() => {
            if (user) {
              setOpen(true);
            } else {
              homeDispatch({
                field: 'showLoginSignUpModel',
                value: true,
              });
              closeModel();
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
      <LogoutClearBrowserDialog
        open={open}
        setOpen={setOpen}
        logoutCallback={() => {
          handleUserLogout({ clearBrowserChatHistory: false });
        }}
        logoutAndClearCallback={() => {
          handleUserLogout({ clearBrowserChatHistory: true });
        }}
      />
    </div>
  );
}
