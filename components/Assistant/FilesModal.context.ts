import { Dispatch, createContext } from "react";
import { ActionType } from "@/hooks/useCreateReducer";

import { UploadedFile, UploadedFileMap } from "@/types/uploadedFile";

export interface FilesModalState {
  uploadedFiles: UploadedFileMap;
  uploadedFilenames: string[];
  loading: boolean;
  nextFile: string | null;
}

export interface FilesModelContextProps {
  state: FilesModalState;
  dispatch: Dispatch<ActionType<FilesModalState>>;
  closeModel: () => void;
  loadFiles: () => Promise<{ files: UploadedFile[], next: string | null }>;
  deleteFile: (filename: string) => Promise<boolean>;
  renameAttachment: (oldName: string, newName: string) => boolean;
  uploadAttachments: (files: FileList | File[]) => Promise<boolean>;
}

const FilesModelContext = createContext<FilesModelContextProps>(undefined!);

export default FilesModelContext;
