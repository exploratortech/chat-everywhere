export interface UploadedFile {
  id: string;
  name: string;
  content: string;
  size: number;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedFileMap {
  [fileId: string]: UploadedFile;
}
