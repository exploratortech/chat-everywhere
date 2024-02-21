import { FC, KeyboardEvent, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { Prompt } from '@/types/prompt';

import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';

interface Props {
  prompt: Prompt;
  onClose: () => void;
  onUpdatePrompt: (prompt: Prompt) => void;
}

export const PromptModal: FC<Props> = ({ prompt, onClose, onUpdatePrompt }) => {
  const { t } = useTranslation('promptbar');
  const [name, setName] = useState(prompt.name);
  const [description, setDescription] = useState(prompt.description);
  const [content, setContent] = useState(prompt.content);

  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleEnter = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      onUpdatePrompt({ ...prompt, name, description, content: content.trim() });
    }
  };

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  return (
    <div onKeyDown={handleEnter}>
      <div className="text-sm font-bold text-black dark:text-neutral-200">
        {t('Name')}
      </div>
      <input
        ref={nameInputRef}
        className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
        placeholder={t('A name for your prompt.') || ''}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="mt-6 text-sm font-bold text-black dark:text-neutral-200">
        {t('Description')}
      </div>
      <textarea
        className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
        style={{ resize: 'none' }}
        placeholder={t('A description for your prompt.') || ''}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />

      <div className="mt-6 text-sm font-bold text-black dark:text-neutral-200">
        {t('Prompt')}
      </div>
      <textarea
        className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
        style={{ resize: 'none' }}
        placeholder={
          t(
            'Prompt content. Use {{}} to denote a variable. Ex: {{name}} is a {{adjective}} {{noun}}',
          ) || ''
        }
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={7}
      />

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm font-bold text-black dark:text-neutral-200">
          {t('Custom Instruction')}
        </div>
        <label
          htmlFor="toggleCustomInstruction"
          className="inline-flex relative items-center cursor-pointer"
        >
          <input
            type="checkbox"
            id="toggleCustomInstruction"
            className="sr-only peer"
            checked={prompt.isCustomInstruction}
            onChange={(e) =>
              onUpdatePrompt({
                ...prompt,
                isCustomInstruction: e.target.checked,
              })
            }
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
        </label>
      </div>
      <DialogFooter className="sm:justify-start">
        <DialogClose asChild>
          <button
            type="button"
            className="w-full px-4 py-2 mt-6 border rounded-lg shadow border-neutral-500 text-neutral-900 hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300"
            onClick={() => {
              const updatedPrompt = {
                ...prompt,
                name,
                description,
                content: content.trim(),
              };

              onUpdatePrompt(updatedPrompt);
            }}
          >
            {t('Save')}
          </button>
        </DialogClose>
      </DialogFooter>
    </div>
  );
};
