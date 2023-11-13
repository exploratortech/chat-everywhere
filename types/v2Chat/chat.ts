export type ConversationType = {
  id: string;
  threadId: string;
  messages: MessageType[];
  loading: boolean;
  title: string;
};

export type MessageMetaDataType = {
  imageGenerationStatus?: 'in progress' | 'completed' | 'failed';
  imageGenerationError?: string;
  imageUrl?: string;
};

export type MessageType = {
  role: string;
  content: string;
  metadata?: MessageMetaDataType;
};

export type OpenAIMessageType = {
  id: string;
  object: string;
  created_at: number;
  thread_id: string;
  role: string;
  content: [
    {
      type: string;
      text: {
        value: string;
        annotations: any[];
      };
    },
  ];
  file_ids: any[];
  assistant_id: string;
  run_id: string;
  metadata?: MessageMetaDataType;
};

export type OpenAIRunType = {
  id: string;
  object: string;
  created_at: number;
  assistant_id: string;
  thread_id: string;
  status: string;
  started_at: number;
  expires_at: number | null;
  cancelled_at: number | null;
  failed_at: number | null;
  completed_at: number;
  last_error: any;
  model: string;
  instructions: any;
  tools: { type: string }[];
  file_ids: any[];
  metadata: any;
  required_action?: {
    type: 'submit_tool_outputs';
    submit_tool_outputs: {
      tool_calls: [
        {
          id: string;
          type: 'function';
          function: {
            name: string;
            arguments: string;
          };
        },
      ];
    };
  };
};

export type OpenAiImageResponseType = {
  created: number;
  data: [
    {
      revised_prompt: string;
      url?: string;
      b64_json?: string;
    },
  ];
  error?: {
    code: string;
    message: string;
    param: string;
    type: string;
  };
};
