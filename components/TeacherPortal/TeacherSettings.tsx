import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Image from 'next/image';

import useTeacherSettings from '@/hooks/useTeacherSettings';
import { TeacherSettings } from '@/types/teacher-settings';

const TeacherSettings = () => {
  const { t } = useTranslation('model');

  const { fetchSettingsQuery, updateSettingsMutation } = useTeacherSettings();
  const { data: settings } = fetchSettingsQuery;

  const [formState, setFormState] = useState<TeacherSettings>({
    allow_student_use_line: false,
    hidden_chateverywhere_default_character_prompt: false,
  });

  useEffect(() => {
    if (settings) {
      setFormState(settings);
    }
  }, [settings]);
  const { mutate: updateSettings } = updateSettingsMutation;


  return (
    <div>
      <h1 className="font-bold mb-4">{t('Settings')}</h1>
      <div className="flex flex-col gap-4 mb-8 content-start">
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm font-bold text-black dark:text-neutral-200">
            {t('Allow Student to use LINE')}{' '}
            <Image
              src="/assets/line-icon.webp"
              alt="Line icon"
              className="inline-block"
              width="50"
              height="50"
            />
          </div>
          <label
            htmlFor="toggleAllowStudentToUseLine"
            className="inline-flex relative items-center cursor-pointer"
          >
            <input
              type="checkbox"
              id="toggleAllowStudentToUseLine"
              className="sr-only peer"
              checked={formState.allow_student_use_line}
              onChange={(e) =>
                  {
                      setFormState({
                        ...formState,
                        allow_student_use_line: e.target.checked,
                      })
                      updateSettings({
                    ...formState,
                        allow_student_use_line: e.target.checked,
                      });
                          }
                }

            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
          </label>
        </div><div className="flex items-center justify-between">
          <div className="text-sm font-bold text-black dark:text-neutral-200">
            {t('Hidden ChatEverywhere Default Character Prompt')}{' '}
          </div>
          <label
            htmlFor="toggleHiddenChatEverywhereDefaultCharacterPrompt"
            className="inline-flex relative items-center cursor-pointer"
          >
            <input
              type="checkbox"
              id="toggleHiddenChatEverywhereDefaultCharacterPrompt"
              className="sr-only peer"
              checked={formState.hidden_chateverywhere_default_character_prompt}
              onChange={(e) =>
                  {
                      setFormState({
                        ...formState,
                        hidden_chateverywhere_default_character_prompt: e.target.checked,
                      })
                      updateSettings({
                    ...formState,
                        hidden_chateverywhere_default_character_prompt: e.target.checked,
                      });
                          }
                }

            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default TeacherSettings;
