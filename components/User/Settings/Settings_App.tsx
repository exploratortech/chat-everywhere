import { IconMoon, IconSun } from '@tabler/icons-react';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { SpeechSpeedType } from '@/components/CognitiveService/CognitiveServiceProvider';
import { useCognitiveService } from '@/components/CognitiveService/CognitiveServiceProvider';
import { SidebarButton } from '@/components/Sidebar/SidebarButton';
import HomeContext from '@/components/home/home.context';

export default function Settings_App() {
  const { t } = useTranslation('model');
  const [speechSpeedConfig, setSpeechSpeedConfig] =
    useState<SpeechSpeedType>('normal');
  const {
    state: { lightMode, isPaidUser },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const { getSpeechConfig, setSpeechSpeed } = useCognitiveService();

  const speechSpeedOnChange = (value: string) => {
    setSpeechSpeedConfig(value as SpeechSpeedType);
    setSpeechSpeed(value as SpeechSpeedType);
  };

  useEffect(() => {
    const { speechSpeed } = getSpeechConfig();
    setSpeechSpeedConfig(speechSpeed);
  }, [getSpeechConfig]);

  return (
    <div>
      <h1 className="mb-4 font-bold">{t('App')}</h1>
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
      {isPaidUser && (
        <>
          <div className="inline-flex w-full items-center justify-center">
            <hr className="my-8 h-px w-64 border-0 bg-gray-200 dark:bg-gray-700" />
            <span className="absolute left-1/2 -translate-x-1/2 bg-[#171717] px-3 text-white">
              {t('Speech configuration')}
            </span>
          </div>
          <div className="mt-0 flex flex-col items-center bg-transparent md:space-x-4">
            <div className="flex w-full flex-row">
              <div className="w-1/2">
                <label
                  htmlFor="speechSpeed"
                  className="block text-sm font-medium"
                >
                  {t('Speech Speed')}
                </label>
              </div>
              <div className="w-1/2">
                <select
                  id="speechSpeed"
                  name="speechSpeed"
                  value={speechSpeedConfig}
                  onChange={(e) => speechSpeedOnChange(e.target.value)}
                  className="mt-1 block w-full rounded-md bg-[#171717] py-2 pl-3 pr-10 text-end text-sm focus:outline-none"
                >
                  <option value={'slow'}>{t('Slow')}</option>
                  <option value={'normal'}>{t('Normal')}</option>
                  <option value={'fast'}>{t('Fast')}</option>
                </select>
              </div>
            </div>
            <p className="!ml-0 mt-2 w-full text-left text-xs text-gray-500">
              {t(
                "The 'Auto' option in Speech language will not be affected by the Speech speed setting.",
              )}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
