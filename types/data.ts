export interface KeyValuePair {
  key: string;
  value: any;
}

export type mqttConnectionType = {
  id: string;
  name?: string;
  description?: string;
  topic?: string;
  payload?: string;
};

export type newMqttConnectionType = Pick<
  mqttConnectionType,
  'description' | 'topic' | 'payload' | 'name'
>;