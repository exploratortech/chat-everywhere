import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { useCreateReducer } from '@/hooks/useCreateReducer';

import { SettingsModelContext } from './SettingsModel';

type Props = {
  className?: string;
};
export default function Sidebar({ className = '' }: Props) {
  const {
    state: { showing },
    dispatch,
  } = useContext(SettingsModelContext);
  const { t } = useTranslation('model');
  const items = [
    {
      name: t('Account'),
      callback: () =>
        dispatch({
          field: 'showing',
          value: 'account',
        }),
    },
    {
      name: t('App'),
      callback: () =>
        dispatch({
          field: 'showing',
          value: 'app',
        }),
    },
    {
      name: t('Data'),
      callback: () =>
        dispatch({
          field: 'showing',
          value: 'data',
        }),
    },
  ];

  return (
    <div className={`${className}`}>
      <b className="pt-6 px-6 block select-none">{t('Settings')}</b>
      <div className="py-6 flex flex-col">
        {items.map((item, i) => (
          <a
            key={`${i} ${item.name}`}
            href="#"
            className="py-2 px-4 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            onClick={item.callback}
          >
            {item.name}
          </a>
        ))}
      </div>
    </div>
  );
}
