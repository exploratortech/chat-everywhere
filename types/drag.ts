export interface DragData {
  data: any;
  type: DragDataType;
}

export type DragDataType = 'conversation' | 'folder' | 'prompt';
