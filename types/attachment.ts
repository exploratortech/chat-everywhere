export interface Attachment {
  name: string;
  content: string;
  size: number;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentCollection {
  [fileName: string]: Attachment;
}
