import { IconMoon, IconSun } from '@tabler/icons-react';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import HomeContext from '@/pages/api/home/home.context';

import { useAzureTts, SpeechSpeedType } from '@/components/Hooks/useAzureTts';
import { SidebarButton } from '@/components/Sidebar/SidebarButton';

export default function Settings_App() {
  const { t } = useTranslation('model');
  const [speechSpeedConfig, setSpeechSpeedConfig] = useState<SpeechSpeedType>("normal");
  const {
    state: { lightMode },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const { getSpeechSpeed, setSpeechSpeed } = useAzureTts();

  const speechSpeedOnChange = (value: string) => {
    setSpeechSpeedConfig(value as SpeechSpeedType);
    setSpeechSpeed(value as SpeechSpeedType);
  };

  useEffect(() => {
    setSpeechSpeedConfig(getSpeechSpeed());
  }, []);

  return (
    <div>
      <h1 className="font-bold mb-4">{t('App')}</h1>
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
      <div className="inline-flex items-center justify-center w-full">
        <hr className="w-64 h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />
        <span className="absolute px-3 text-white -translate-x-1/2 left-1/2 bg-[#171717]">
          {t('Speech configuration')}
        </span>
      </div>
      <div className="flex mt-4 md:space-x-4 bg-transparent items-center">
        <div className="md:w-1/2">
          <label htmlFor="speechSpeed" className="block text-sm font-medium">
            {t('Speech Speed')}
          </label>
        </div>
        <div className="md:w-1/2">
          <select
            id="speechSpeed"
            name="speechSpeed"
            value={speechSpeedConfig}
            onChange={(e) => speechSpeedOnChange(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base focus:outline-none sm:text-sm rounded-md bg-transparent text-end"
          >
            <option value={'slow'}>{t('Slow')}</option>
            <option value={'normal'}>{t('Normal')}</option>
            <option value={'fast'}>{t('Fast')}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
