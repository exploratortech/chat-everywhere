import { FC, KeyboardEvent, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'next-i18next';

import useTeacherPrompt from '@/hooks/useTeacherPrompt';

import { OpenAIModel, OpenAIModels } from '@/types/openai';
import { TeacherPrompt } from '@/types/prompt';

import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  prompt: TeacherPrompt;
  onUpdatePrompt: (prompt: TeacherPrompt) => void;
}
interface ModelSelectProps {
  model: OpenAIModel;
  setModel: (model: OpenAIModel) => void;
}

const ModelSelect = ({ model, setModel }: ModelSelectProps) => {
  const handleChange = (value: string) => {
    const selectedModel = Object.values(OpenAIModels).find(
      (model) => model.id === value,
    );
    if (selectedModel) {
      setModel(selectedModel);
    }
  };
  return (
    <Select onValueChange={handleChange} defaultValue={model.id}>
      <SelectTrigger className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:bg-[#40414F] dark:text-neutral-100">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-white dark:bg-[#40414F]">
        {Object.values(OpenAIModels).map((model) => (
          <SelectItem
            key={model.id}
            value={model.id}
            className="px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {model.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const TeacherPromptModal: FC<Props> = ({ prompt, onUpdatePrompt }) => {
  const { t } = useTranslation('promptbar');
  const [name, setName] = useState(prompt.name);
  const [description, setDescription] = useState(prompt.description);
  const [content, setContent] = useState(prompt.content);
  const [model, setModel] = useState(prompt.model);
  const [isEnable, setIsEnable] = useState(prompt.is_enable);
  const { removeMutation } = useTeacherPrompt();
  const { mutate: removePrompt } = removeMutation;

  // const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleEnter = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      onUpdatePrompt({
        ...prompt,
        name,
        description,
        content: content.trim(),
        model,
        is_enable: isEnable,
      });
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
        placeholder={t('') || ''}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={7}
      />
      <div className="mt-6 text-sm font-bold text-black dark:text-neutral-200">
        {t('Model')}
      </div>
      <ModelSelect model={model} setModel={setModel} />

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm font-bold text-black dark:text-neutral-200">
          {t('Show to students')}
        </div>
        <label
          htmlFor="toggleIsEnable"
          className="inline-flex relative items-center cursor-pointer"
        >
          <input
            type="checkbox"
            id="toggleIsEnable"
            className="sr-only peer"
            checked={isEnable}
            onChange={(e) => setIsEnable(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
        </label>
      </div>
      <DialogFooter>
        <DialogClose className="w-full">
          <div className="flex flex-col gap-6">
            <Button
              type="button"
              className="w-full px-4 py-2 mt-6 border rounded-lg shadow border-neutral-500 text-neutral-900 hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300"
              onClick={() => {
                const updatedPrompt = {
                  ...prompt,
                  name,
                  description,
                  content: content.trim(),
                  is_enable: isEnable,
                  model,
                };

                onUpdatePrompt(updatedPrompt);
              }}
            >
              {t('Save')}
            </Button>
            <Button
              onClick={() => {
                removePrompt(prompt.id);
              }}
              variant={'destructive'}
              className=""
            >
              Remove
            </Button>
          </div>
        </DialogClose>
      </DialogFooter>
    </div>
  );
};
