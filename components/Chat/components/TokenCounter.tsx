import { IconCircleLetterT } from '@tabler/icons-react';
import React, { useContext, useEffect, useMemo, useState } from 'react';

import useDebounce from '@/hooks/useDebounce';

import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';

import { OpenAIModelID, OpenAIModels } from '@/types/openai';
import { PluginID } from '@/types/plugin';

import HomeContext from '@/components/home/home.context';

import cl100k_base from '@dqbd/tiktoken/encoders/cl100k_base.json';
import { Tiktoken } from '@dqbd/tiktoken/lite';

interface Props {
  value?: string;
  className?: string;
  setIsOverLimit: (isOverLimit: boolean) => void;
  setIsCloseToLimit: (isCloseToLimit: boolean) => void;
}

export const getTokenLength = (value: string) => {
  const encoding = new Tiktoken(
    cl100k_base.bpe_ranks,
    cl100k_base.special_tokens,
    cl100k_base.pat_str,
  );
  const tokens = encoding.encode(value);
  encoding.free();
  return tokens.length;
};

const promptTokensLength = getTokenLength(DEFAULT_SYSTEM_PROMPT);

function TokenCounter({
  value = '',
  className = '',
  setIsOverLimit,
  setIsCloseToLimit,
}: Props) {
  const [currentTokenUsage, setCurrentTokenUsage] = useState(0);
  const debouncedValue = useDebounce<string>(value, 500);

  const {
    state: { currentMessage, isPaidUser },
  } = useContext(HomeContext);

  const modelMaxTokenLength = useMemo(() => {
    switch (currentMessage?.pluginId) {
      case PluginID.GPT4:
        return (
          OpenAIModels[OpenAIModelID.GPT_4].tokenLimit -
          OpenAIModels[OpenAIModelID.GPT_4].completionTokenLimit
        );
      case PluginID.GPT4O:
        return (
          OpenAIModels[OpenAIModelID.GPT_4O].tokenLimit -
          OpenAIModels[OpenAIModelID.GPT_4O].completionTokenLimit
        );
      default:
        // Only enable 16k model for pro users
        const defaultModel = isPaidUser
          ? OpenAIModels[OpenAIModelID.GPT_3_5_16K]
          : OpenAIModels[OpenAIModelID.GPT_3_5];
        return defaultModel.tokenLimit - defaultModel.completionTokenLimit;
    }
  }, [currentMessage?.pluginId, isPaidUser]);

  const maxToken = useMemo(() => {
    return modelMaxTokenLength - promptTokensLength;
  }, [modelMaxTokenLength]);

  useEffect(() => {
    setCurrentTokenUsage(debouncedValue ? getTokenLength(debouncedValue) : 0);
  }, [debouncedValue]);

  useEffect(() => {
    setIsOverLimit(currentTokenUsage > maxToken);
    setIsCloseToLimit(currentTokenUsage + 500 >= maxToken);
  }, [currentTokenUsage, maxToken, setIsCloseToLimit, setIsOverLimit]);

  return (
    <div className={`${className} flex items-center`}>
      <IconCircleLetterT
        className="mx-[.4rem] inline-block"
        size={18}
        strokeWidth={2}
      />
      {`${currentTokenUsage} / ${maxToken}`}
    </div>
  );
}

export default TokenCounter;
