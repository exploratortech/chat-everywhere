import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Image from 'next/image';

import useTeacherSettings from '@/hooks/teacherPortal/useTeacherSettings';

import type { TeacherSettingsInPortal } from '@/types/teacher-settings';

const TeacherSettings = () => {
  const { t } = useTranslation('model');

  const { fetchSettingsQuery, updateSettingsMutation } = useTeacherSettings();
  const { data: settings } = fetchSettingsQuery;

  const [formState, setFormState] = useState<TeacherSettingsInPortal>({
    allow_student_use_line: false,
    hidden_chateverywhere_default_character_prompt: false,
    should_clear_conversations_on_logout: false,
  });

  useEffect(() => {
    if (settings) {
      setFormState(settings);
    }
  }, [settings]);
  const { mutate: updateSettings } = updateSettingsMutation;

  return (
    <div>
      <h1 className="mb-4 font-bold">{t('Settings')}</h1>
      <div className="mb-8 flex flex-col content-start gap-4">
        <div className="mt-6 flex min-h-[50px] items-center justify-between">
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
            className="relative inline-flex cursor-pointer items-center"
          >
            <input
              type="checkbox"
              id="toggleAllowStudentToUseLine"
              className="peer sr-only"
              checked={formState.allow_student_use_line}
              onChange={(e) => {
                setFormState({
                  ...formState,
                  allow_student_use_line: e.target.checked,
                });
                updateSettings({
                  ...formState,
                  allow_student_use_line: e.target.checked,
                });
              }}
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-green-800"></div>
          </label>
        </div>
        <div className="flex min-h-[50px] items-center justify-between">
          <div className="text-sm font-bold text-black dark:text-neutral-200">
            {t('Hidden ChatEverywhere Default Character Prompt')}{' '}
          </div>
          <label
            htmlFor="toggleHiddenChatEverywhereDefaultCharacterPrompt"
            className="relative inline-flex cursor-pointer items-center"
          >
            <input
              type="checkbox"
              id="toggleHiddenChatEverywhereDefaultCharacterPrompt"
              className="peer sr-only"
              checked={formState.hidden_chateverywhere_default_character_prompt}
              onChange={(e) => {
                setFormState({
                  ...formState,
                  hidden_chateverywhere_default_character_prompt:
                    e.target.checked,
                });
                updateSettings({
                  ...formState,
                  hidden_chateverywhere_default_character_prompt:
                    e.target.checked,
                });
              }}
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-green-800"></div>
          </label>
        </div>
        <div className="flex min-h-[50px] items-center justify-between">
          <div className="text-sm font-bold text-black dark:text-neutral-200">
            {t('Automatic clear Conversations on student logout')}
          </div>
          <label
            htmlFor="toggleShouldClearConversationsOnStudentLogout"
            className="relative inline-flex cursor-pointer items-center"
          >
            <input
              type="checkbox"
              id="toggleShouldClearConversationsOnStudentLogout"
              className="peer sr-only"
              checked={formState.should_clear_conversations_on_logout}
              onChange={(e) => {
                setFormState({
                  ...formState,
                  should_clear_conversations_on_logout: e.target.checked,
                });
                updateSettings({
                  ...formState,
                  should_clear_conversations_on_logout: e.target.checked,
                });
              }}
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-green-800"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default TeacherSettings;
