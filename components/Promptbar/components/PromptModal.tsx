import { IconFileImport } from '@tabler/icons-react';
import type { FC, KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Tooltip } from 'react-tooltip';

import { useTranslation } from 'next-i18next';

import type {
  CustomInstructionPrompt,
  Prompt,
  RegularPrompt,
} from '@/types/prompt';

import TokenCounter from '@/components/Chat/components/TokenCounter';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';

interface Props {
  prompt: Prompt;
  onClose: () => void;
  onUpdatePrompt: (prompt: Prompt) => void;
}

export const PromptModal: FC<Props> = ({ prompt, onUpdatePrompt }) => {
  const { t } = useTranslation('promptbar');
  const [name, setName] = useState(prompt.name);
  const [description, setDescription] = useState(prompt.description);
  const [content, setContent] = useState(prompt.content);
  const [isOverTokenLimit, setIsOverTokenLimit] = useState(false);
  const [isCloseToTokenLimit, setIsCloseToTokenLimit] = useState(false);
  const [displayFileImportMessage, setDisplayFileImportMessage] =
    useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleEnter = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      onUpdatePrompt({ ...prompt, name, description, content: content.trim() });
    }
  };

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (isCloseToTokenLimit || isOverTokenLimit) {
      setDisplayFileImportMessage(true);
    }
  }, [isCloseToTokenLimit, isOverTokenLimit]);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      setDisplayFileImportMessage(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result;
          const newContent = `${content} \n --- ${file.name} --- \n ${text}`;
          setContent(newContent.trim() || '');
        } catch (error) {
          console.error('Error reading file:', error);
          toast.error(t('Failed to read the file'));
        }
      };
      reader.readAsText(file);
    }
  };

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
      <div className="flex w-full items-center justify-end">
        <input
          type="file"
          accept=".txt"
          style={{ display: 'none' }}
          onChange={handleFileImport}
          id="fileInput"
        />
        <div
          data-tooltip-id="import-tooltip"
          data-tooltip-place="left"
          data-tooltip-variant="light"
        >
          <IconFileImport
            size={16}
            onClick={() => document.getElementById('fileInput')?.click()}
            className="cursor-pointer text-neutral-400 hover:text-neutral-100"
          />
        </div>
        <Tooltip
          id="import-tooltip"
          content={t('Import from .txt file') || ''}
          place="bottom"
        />
        <TokenCounter
          className={`
              ${isOverTokenLimit ? '!text-red-500 dark:text-red-600' : ''}
              ${isCloseToTokenLimit || isOverTokenLimit ? 'visible' : 'hidden'}
              text-sm text-neutral-500 dark:text-neutral-400
            `}
          value={content}
          setIsOverLimit={setIsOverTokenLimit}
          setIsCloseToLimit={setIsCloseToTokenLimit}
        />
      </div>

      {displayFileImportMessage && (
        <div className="mt-2 text-sm text-yellow-300">
          {t(
            "Please be aware that for long files, it's best to use this prompt in default mode as a Pro member because it can handle much longer context.",
          )}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm font-bold text-black dark:text-neutral-200">
          {t('Custom Instruction')}
        </div>
        <label
          htmlFor="toggleCustomInstruction"
          className="relative inline-flex cursor-pointer items-center"
        >
          <input
            type="checkbox"
            id="toggleCustomInstruction"
            className="peer sr-only"
            checked={prompt.isCustomInstruction}
            onChange={(e) =>
              onUpdatePrompt({
                ...prompt,
                isCustomInstruction: !!e.target.checked,
              } as RegularPrompt | CustomInstructionPrompt)
            }
          />
          <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-green-800"></div>
        </label>
      </div>
      <DialogFooter className="sm:justify-start">
        <DialogClose asChild>
          <button
            type="button"
            className="mt-6 w-full cursor-pointer rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow hover:bg-neutral-100 focus:outline-none disabled:cursor-not-allowed dark:border-neutral-800 dark:border-opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300 disabled:dark:bg-slate-400"
            disabled={isOverTokenLimit}
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
