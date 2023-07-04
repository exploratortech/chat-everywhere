import { IconMoon, IconSun } from '@tabler/icons-react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import HomeContext from '@/pages/api/home/home.context';

import { SidebarButton } from '@/components/Sidebar/SidebarButton';

export default function Settings_App() {
  const { t } = useTranslation('sidebar');
  const {
    state: { lightMode },
    dispatch: homeDispatch,
  } = useContext(HomeContext);
  return (
    <div>
      <h1 className="font-bold mb-4">App</h1>
      <SidebarButton
        text={lightMode === 'light' ? t('Dark mode') : t('Light mode')}
        icon={
          lightMode === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />
        }
        onClick={() =>
          homeDispatch({
            field: 'lightMode',
            value: lightMode === 'light' ? 'dark' : 'light',
          })
        }
      />
    </div>
  );
}
