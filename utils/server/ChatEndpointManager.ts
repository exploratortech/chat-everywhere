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

  constructor(modelId: OpenAIModelID) {
    const { endpoints, keys, tpm } = this.getEndpointConfigByModel(modelId);
    this.endpoints = endpoints.map((endpoint, index) => ({
      endpoint,
      key: keys[index],
      weight: tpm[index],
      isThrottled: false,
    }));
  }

  private getEndpointConfigByModel(modelId: OpenAIModelID) {
    switch (modelId) {
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

  // Add OPENAI ENDPOINT as a backup endpoint
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
    console.log(
      '✅ AVAILABLE ENDPOINTS LENGTH: ',
      this.endpoints.filter((e) => !e.isThrottled).length,
    );
    return this.endpoints.filter((e) => !e.isThrottled);
  }
}
