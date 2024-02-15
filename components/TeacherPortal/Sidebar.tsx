import {
  IconBuildingBroadcastTower,
  IconRating12Plus,
} from '@tabler/icons-react';
import React, { cloneElement, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { trackEvent } from '@/utils/app/eventTracking';

import { TeacherPortalContext } from './teacher-portal.context';

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

export default function Sidebar({ className = '' }: Props) {
  const {
    state: { showing },
    dispatch,
  } = useContext(TeacherPortalContext);
  const { t } = useTranslation('model');
  const iconClass = 'h-[18px] tablet:h-[22px] tablet:w-[36px]';
  const items: sideBarItemType[] = [
    {
      icon: <IconRating12Plus />,
      name: t('One-time code'),
      value: 'account',
      callback: () => {
        trackEvent('Account button clicked');
        dispatch({
          field: 'showing',
          value: 'one-time-code',
        });
      },
    },
    {
      icon: <IconBuildingBroadcastTower />,
      name: t('Shared message'),
      value: 'app',
      callback: () => {
        trackEvent('App button clicked');
        dispatch({
          field: 'showing',
          value: 'shared-message',
        });
      },
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

      <div className="flex flex-col"></div>
    </div>
  );
}
