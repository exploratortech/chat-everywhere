import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { getAvailableLocales } from '@/utils/app/i18n';
import { saveOutputLanguage } from '@/utils/app/outputLanguage';

import HomeContext from '@/components/home/home.context';

function ChangeOutputLanguageButton() {
  const { t } = useTranslation('model');

  const {
    state: { outputLanguage },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const availableLocales = getAvailableLocales();

  const locales = [
    {
      name: t('Auto'),
      value: '',
    },
    ...availableLocales,
  ];

  return (
    <div className="mt-2 flex flex-row items-center justify-between md:mt-0 md:justify-start">
      <label className="mr-2 text-left text-sm text-neutral-700 dark:text-neutral-400">
        {t('Language')}
      </label>
      <div className="w-fit rounded-lg border border-neutral-200 bg-transparent pr-1 text-neutral-900 focus:outline-none dark:border-neutral-600 dark:text-white">
        <select
          className="bg-transparent p-2 focus:outline-none"
          placeholder={t('Select a lang') || ''}
          value={outputLanguage}
          onChange={(e) => {
            homeDispatch({ field: 'outputLanguage', value: e.target.value });
            saveOutputLanguage(e.target.value);
          }}
        >
          {locales.map((locale) => (
            <option
              key={locale.value}
              value={locale.value}
              className="dark:bg-[#343541] dark:text-white"
            >
              {locale.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

ChangeOutputLanguageButton.propTypes = {};
export default ChangeOutputLanguageButton;
