import {
  AZURE_OPENAI_ENDPOINTS,
  AZURE_OPENAI_GPT_4_ENDPOINTS,
  AZURE_OPENAI_GPT_4_KEYS,
  AZURE_OPENAI_GPT_4_TPM,
  AZURE_OPENAI_KEYS,
  AZURE_OPENAI_TPM,
} from '../app/const';

type EndpointInfo = {
  endpoint: string | undefined;
  key: string | undefined;
  weight: number;
  isThrottled: boolean;
};

class EndpointManager {
  private endpoints: EndpointInfo[] = [];

  constructor(
    endpoints: (string | undefined)[],
    keys: (string | undefined)[],
    weights: number[],
  ) {
    this.endpoints = endpoints.map((endpoint, index) => ({
      endpoint,
      key: keys[index],
      weight: weights[index],
      isThrottled: false,
    }));
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
  }
}

// // Usage example
// const manager = new EndpointManager(
//   includeGPT4 ? AZURE_OPENAI_GPT_4_ENDPOINTS : AZURE_OPENAI_ENDPOINTS,
//   includeGPT4 ? AZURE_OPENAI_GPT_4_KEYS : AZURE_OPENAI_KEYS,
//   includeGPT4 ? AZURE_OPENAI_GPT_4_TPM : AZURE_OPENAI_TPM,
// );

// const { endpoint, key } = manager.getEndpointAndKey();
// if (endpoint && key) {
//   // Use the endpoint and key
// } else {
//   console.error('No available endpoints');
// }

// // Mark an endpoint as throttled
// manager.markEndpointAsThrottled(endpoint);
