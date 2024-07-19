import {
  AZURE_OPENAI_ENDPOINTS,
  AZURE_OPENAI_GPT_4O_ENDPOINTS,
  AZURE_OPENAI_GPT_4O_KEYS,
  AZURE_OPENAI_GPT_4O_TPM,
  AZURE_OPENAI_GPT_4_ENDPOINTS,
  AZURE_OPENAI_GPT_4_KEYS,
  AZURE_OPENAI_GPT_4_TPM,
  AZURE_OPENAI_KEYS,
  AZURE_OPENAI_TPM,
  OPENAI_API_HOST,
  OPENAI_API_KEY,
} from '@/utils/app/const';

import type { OpenAIModel } from '@/types/openai';
import { OpenAIModelID } from '@/types/openai';

type EndpointInfo = {
  endpoint: string | undefined;
  key: string | undefined;
  weight: number;
  isThrottled: boolean;
};

export class ChatEndpointManager {
  private endpoints: EndpointInfo[] = [];
  private useBackupEndpoint: boolean = false;
  private model: OpenAIModel;

  constructor(model: OpenAIModel, usePriorityEndpoint: boolean = false) {
    this.model = model;
    if (usePriorityEndpoint) {
      this.useBackupEndpoint = true;
      this.addBackupEndpoint();
    } else {
      const { endpoints, keys, tpm } = this.getEndpointConfigByModel(model);
      this.endpoints = endpoints.map((endpoint, index) => ({
        endpoint,
        key: keys[index],
        weight: tpm[index],
        isThrottled: false,
      }));
    }
  }

  private getEndpointConfigByModel(model: OpenAIModel) {
    switch (model.id) {
      case OpenAIModelID.GPT_4O:
        return {
          endpoints: AZURE_OPENAI_GPT_4O_ENDPOINTS,
          keys: AZURE_OPENAI_GPT_4O_KEYS,
          tpm: AZURE_OPENAI_GPT_4O_TPM,
        };
      case OpenAIModelID.GPT_4:
        return {
          endpoints: AZURE_OPENAI_GPT_4_ENDPOINTS,
          keys: AZURE_OPENAI_GPT_4_KEYS,
          tpm: AZURE_OPENAI_GPT_4_TPM,
        };
      default:
        return {
          endpoints: AZURE_OPENAI_ENDPOINTS,
          keys: AZURE_OPENAI_KEYS,
          tpm: AZURE_OPENAI_TPM,
        };
    }
  }

  // NOTE: Using priority endpoint as the backup endpoint
  // This will be selected if all endpoints are throttled
  private addBackupEndpoint() {
    this.endpoints.push({
      endpoint: OPENAI_API_HOST,
      key: OPENAI_API_KEY,
      weight: 1,
      isThrottled: false,
    });
  }

  private selectEndpointByWeight(): EndpointInfo | null {
    const availableEndpoints = this.endpoints.filter(
      (endpoint) => !endpoint.isThrottled,
    );

    if (availableEndpoints.length === 0) {
      return null;
    }

    const cumulativeWeights: number[] = [];
    let totalWeight = 0;

    for (let i = 0; i < availableEndpoints.length; i++) {
      totalWeight += availableEndpoints[i].weight;
      cumulativeWeights.push(totalWeight);
    }

    const randomWeight = Math.random() * totalWeight;

    for (let i = 0; i < cumulativeWeights.length; i++) {
      if (randomWeight <= cumulativeWeights[i]) {
        return availableEndpoints[i];
      }
    }

    return null;
  }

  public getEndpointAndKey(): {
    endpoint: string | undefined;
    key: string | undefined;
  } | null {
    const selected = this.selectEndpointByWeight();
    if (selected) {
      return { endpoint: selected.endpoint, key: selected.key };
    }
    return null;
  }

  public markEndpointAsThrottled(endpoint: string | undefined): void {
    const endpointInfo = this.endpoints.find((e) => e.endpoint === endpoint);
    if (endpointInfo) {
      endpointInfo.isThrottled = true;
    }
    if (this.getAvailableEndpoints().length === 0 && !this.useBackupEndpoint) {
      this.useBackupEndpoint = true;
      this.addBackupEndpoint();
    }
  }

  public getTotalEndpoints(): EndpointInfo[] {
    return this.endpoints;
  }
  public getThrottledEndpoints(): EndpointInfo[] {
    return this.endpoints.filter((e) => e.isThrottled);
  }
  public getAvailableEndpoints(): EndpointInfo[] {
    return this.endpoints.filter((e) => !e.isThrottled);
  }

  public getFetchOptions({
    messagesToSendInArray,
    temperature,
  }: {
    messagesToSendInArray: any[];
    temperature: number;
  }): {
    url: string;
    options: RequestInit;
  } {
    const { endpoint, key: apiKey } = this.getEndpointAndKey() || {};

    if (!endpoint || !apiKey) {
      throw new Error('No available endpoints');
    }

    // Determine the URL based on the endpoint domain
    const baseUrl = endpoint.includes(OPENAI_API_HOST)
      ? `${endpoint}/v1/chat/completions`
      : `${endpoint}/openai/deployments/${this.model.deploymentName}/chat/completions?api-version=2024-02-01`;

    const bodyToSend = {
      messages: messagesToSendInArray,
      max_tokens: this.model.completionTokenLimit,
      temperature,
      stream: true,
      presence_penalty: 0,
      frequency_penalty: 0,
      model: endpoint.includes(OPENAI_API_HOST) ? this.model.id : undefined,
    };

    const requestHeaders = {
      'Content-Type': 'application/json',
      ...(endpoint.includes(OPENAI_API_HOST)
        ? { Authorization: `Bearer ${apiKey}` }
        : { 'api-key': apiKey }),
    };

    return {
      url: baseUrl,
      options: {
        headers: requestHeaders,
        method: 'POST',
        body: JSON.stringify(bodyToSend),
      },
    };
  }
}
