export interface FolderInterface {
  id: string;
  name: string;
  type: FolderType;
  lastUpdateAtUTC: number; // timestamp in UTC in milliseconds
  rank: number;
  deleted?: boolean;
}

export type FolderType = 'chat' | 'prompt';
