export interface DragData {
  id: string;
  type: DragDataType;
}

export type DragDataType = 'chat' | 'prompt' | 'chat-folder' | 'prompt-folder';
