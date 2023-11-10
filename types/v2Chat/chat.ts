export type ConversationType = {
  id: string;
  threadId: string;
  messages: MessageType[];
  loading: boolean;
  title: string;
}

export type MessageType = {
  role: string;
  content: string;
}

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
    }
  ];
  file_ids: any[];
  assistant_id: string;
  run_id: string;
  metadata: any;
}