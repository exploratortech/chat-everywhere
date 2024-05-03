export interface OpenAIModel {
  id: string;
  name: string;
  maxLength: number; // maximum length of a message
  tokenLimit: number;
  completionTokenLimit: number;
  deploymentName?: string;
}

export enum OpenAIModelID {
  // 0613 is the latest model with better model steerability, enable by default.
  GPT_3_5 = 'gpt-3.5-turbo-0613',
  GPT_3_5_AZ = 'gpt-35-turbo',
  GPT_3_5_16K = 'gpt-3.5-turbo-16k',
  GPT_4 = 'gpt-4',
  GPT_4_32K = 'gpt-4-32k',
}

export const fallbackModelID = OpenAIModelID.GPT_3_5;

export const OpenAIModels: Record<OpenAIModelID, OpenAIModel> = {
  [OpenAIModelID.GPT_3_5]: {
    id: OpenAIModelID.GPT_3_5,
    name: 'GPT-3.5',
    maxLength: 12000,
    tokenLimit: 4000,
    completionTokenLimit: 2500,
    deploymentName: 'gpt-35',
  },
  [OpenAIModelID.GPT_3_5_AZ]: {
    id: OpenAIModelID.GPT_3_5_AZ,
    name: 'GPT-3.5',
    maxLength: 12000,
    tokenLimit: 4000,
    completionTokenLimit: 2500,
    deploymentName: 'gpt-35',
  },
  [OpenAIModelID.GPT_3_5_16K]: {
    id: OpenAIModelID.GPT_3_5_16K,
    name: 'GPT-3.5-16K',
    maxLength: 48000,
    tokenLimit: 16000,
    completionTokenLimit: 4000,
    deploymentName: 'gpt-35-16k',
  },
  [OpenAIModelID.GPT_4]: {
    id: OpenAIModelID.GPT_4,
    name: 'GPT-4',
    maxLength: 24000,
    tokenLimit: 7000,
    completionTokenLimit: 2000,
    deploymentName: 'gpt-4',
  },
  [OpenAIModelID.GPT_4_32K]: {
    id: OpenAIModelID.GPT_4_32K,
    name: 'GPT-4-32K',
    maxLength: 96000,
    tokenLimit: 32000,
    completionTokenLimit: 8000,
    deploymentName: 'gpt-4-32k',
  },
};
