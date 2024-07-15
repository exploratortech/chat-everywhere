import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { getAvailableSpeechSourceLanguages } from '@/utils/app/i18n';
import { saveSpeechRecognitionLanguage } from '@/utils/app/speechRecognitionLanguage.ts';

import HomeContext from '@/components/home/home.context';

const SpeechRecognitionLanguageSelector = () => {
  const { t } = useTranslation('model');

  const {
    state: { speechRecognitionLanguage },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const sourceLanguages = getAvailableSpeechSourceLanguages();

  return (
    <div className="flex flex-row items-center justify-between">
      <label className="mr-2 text-left text-sm text-neutral-700 dark:text-neutral-400">
        {t('Voice language')}
      </label>
      <div className="w-fit rounded-lg border border-neutral-200 bg-transparent pr-1 text-neutral-900 focus:outline-none dark:border-neutral-600 dark:text-white">
        <select
          className="bg-transparent p-2 focus:outline-none"
          placeholder={t('Select a lang') || ''}
          value={speechRecognitionLanguage}
          onChange={(e) => {
            homeDispatch({
              field: 'speechRecognitionLanguage',
              value: e.target.value,
            });
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
};

export default SpeechRecognitionLanguageSelector;
