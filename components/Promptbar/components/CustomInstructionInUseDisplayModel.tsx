import type { FC } from 'react';
import { useEffect, useRef } from 'react';

import { useTranslation } from 'next-i18next';

import type { Prompt } from '@/types/prompt';
import { isTeacherPrompt } from '@/types/prompt';

interface CustomInstructionInUseDisplayProps {
  prompt: Prompt;
  onClose: () => void;
}

const CustomInstructionInUseDisplayModel: FC<
  CustomInstructionInUseDisplayProps
> = ({ prompt, onClose }) => {
  const { t } = useTranslation('promptbar');
  const { t: chatT } = useTranslation('chat');
  const modalRef = useRef<HTMLDivElement>(null);

  const isTeacherCustomInstructionPrompt = isTeacherPrompt(prompt);

  const title = chatT(
    isTeacherCustomInstructionPrompt
      ? 'Teacher Custom Instruction ({{customInstructionPromptName}}) is in use'
      : 'Custom Instruction ({{customInstructionPromptName}}) is in use',
    {
      customInstructionPromptName: prompt.name,
    },
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="fixed inset-0 z-10 overflow-hidden">
        <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
          <div
            className="hidden sm:inline-block sm:h-screen sm:align-middle"
            aria-hidden="true"
          />

          <div
            ref={modalRef}
            className="inline-block max-h-[400px] overflow-y-auto rounded-lg border border-gray-300 bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all dark:bg-[#202123] sm:my-8 sm:max-h-[600px] sm:w-full sm:max-w-lg sm:p-6 sm:align-middle mobile:h-[70dvh] mobile:max-h-[70dvh] mobile:w-[calc(100dvw-1rem)]"
            role="dialog"
          >
            <div className="mb-4 whitespace-pre-wrap text-center text-lg font-bold">
              {title.toString()}
            </div>

            <div className="text-sm font-bold text-black dark:text-neutral-200">
              {t('Name')}
            </div>
            <input
              className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 opacity-50 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#6B7280] dark:text-neutral-100"
              placeholder={t('A name for your prompt.') || ''}
              value={prompt.name}
              disabled
            />

            <div className="mt-6 text-sm font-bold text-black dark:text-neutral-200">
              {t('Description')}
            </div>
            <textarea
              className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 opacity-50 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#6B7280] dark:text-neutral-100"
              style={{ resize: 'none' }}
              placeholder={t('A description for your prompt.') || ''}
              disabled
              value={prompt.description}
              rows={3}
            />

            <div className="mt-6 text-sm font-bold text-black dark:text-neutral-200">
              {t('Prompt')}
            </div>
            <textarea
              className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 opacity-50 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#6B7280] dark:text-neutral-100"
              style={{ resize: 'none' }}
              placeholder={
                t(
                  'Prompt content. Use {{}} to denote a variable. Ex: {{name}} is a {{adjective}} {{noun}}',
                ) || ''
              }
              value={prompt.content}
              disabled
              rows={12}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomInstructionInUseDisplayModel;
