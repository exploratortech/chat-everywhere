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