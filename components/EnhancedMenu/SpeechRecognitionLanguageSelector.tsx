import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { getAvailableSpeechSourceLanguages } from '@/utils/app/i18n';
import { saveOutputLanguage } from '@/utils/app/outputLanguage';

import HomeContext from '@/pages/api/home/home.context';
import { saveSpeechRecognitionLanguage } from '@/utils/app/speechRecognitionLanguage.ts';

const SpeechRecognitionLanguageSelector = () => {
  const { t } = useTranslation('model');

  const {
    state: { speechRecognitionLanguage },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const sourceLanguages = getAvailableSpeechSourceLanguages();

  return (
    <div className="flex flex-row items-center justify-between md:justify-start">
      <label className="text-left text-sm text-neutral-700 dark:text-neutral-400 mr-2">
        {t('Language')}
      </label>
      <div className="rounded-lg border border-neutral-200 bg-transparent text-neutral-900 dark:border-neutral-600 dark:text-white w-fit pr-1 focus:outline-none">
        <select
          className="w-max-20 bg-transparent p-2 focus:outline-none"
          placeholder={t('Select a lang') || ''}
          value={speechRecognitionLanguage}
          onChange={(e) => {
            homeDispatch({ field: 'speechRecognitionLanguage', value: e.target.value });
            saveSpeechRecognitionLanguage(e.target.value);
          }}
        >
          {sourceLanguages.map((language) => (
            <option
              key={language.value}
              value={language.value}
              className="dark:bg-[#343541] dark:text-white"
            >
              {language.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default SpeechRecognitionLanguageSelector;
