import { FC, useEffect, useRef } from 'react';

import { useTranslation } from 'next-i18next';

import { Prompt } from '@/types/prompt';

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

  const isTeacherCustomInstructionPrompt = prompt.is_teacher_prompt;
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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="fixed inset-0 z-10 overflow-hidden">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="hidden sm:inline-block sm:h-screen sm:align-middle"
            aria-hidden="true"
          />

          <div
            ref={modalRef}
            className="dark:border-netural-400 inline-block max-h-[400px] transform overflow-y-auto rounded-lg border border-gray-300 bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-[#202123] sm:my-8 sm:max-h-[600px] sm:w-full sm:max-w-lg mobile:max-h-[70dvh] mobile:h-[70dvh] mobile:w-[calc(100dvw-1rem)] sm:p-6 sm:align-middle"
            role="dialog"
          >
            <div className="text-center text-lg mb-4 font-bold whitespace-pre-wrap">
              {title}
            </div>

            <div className="text-sm font-bold text-black dark:text-neutral-200">
              {t('Name')}
            </div>
            <input
              className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#6B7280] dark:text-neutral-100 opacity-50"
              placeholder={t('A name for your prompt.') || ''}
              value={prompt.name}
              disabled
            />

            <div className="mt-6 text-sm font-bold text-black dark:text-neutral-200">
              {t('Description')}
            </div>
            <textarea
              className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#6B7280] dark:text-neutral-100 opacity-50"
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
              className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#6B7280] dark:text-neutral-100 opacity-50"
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
