import { useCallback, useMemo, useState } from 'react';

import type { Prompt } from '@/types/prompt';

interface UsePromptListProps {
  originalPrompts: Prompt[];
}

export const usePromptList = ({ originalPrompts }: UsePromptListProps) => {
  const [showPromptList, setShowPromptList] = useState(false);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [activePromptIndex, setActivePromptIndex] = useState(0);

  const prompts = useMemo(() => {
    return originalPrompts.filter((prompt) => !prompt.deleted);
  }, [originalPrompts]);

  const filteredPrompts = useMemo(() => {
    return prompts.filter((prompt) =>
      prompt.name.toLowerCase().includes(promptInputValue.toLowerCase()),
    );
  }, [prompts, promptInputValue]);

  const updatePromptListVisibility = useCallback((text: string) => {
    const match = text.match(/\/\w*$/);
    if (match) {
      setShowPromptList(true);
      setPromptInputValue(match[0].slice(1));
    } else {
      setShowPromptList(false);
      setPromptInputValue('');
    }
  }, []);

  return {
    showPromptList,
    setShowPromptList,
    activePromptIndex,
    setActivePromptIndex,
    filteredPrompts,
    updatePromptListVisibility,
  };
};
