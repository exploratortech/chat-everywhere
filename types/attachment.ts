export interface Attachment {
  name: string;
  content: string;
}

export interface AttachmentCollection {
  [fileName: string]: Attachment;
}
