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
  renameFile: (oldName: string, newName: string) => Promise<boolean>;
  uploadFiles: (files: FileList | File[]) => Promise<boolean>;
}

const FilesModelContext = createContext<FilesModelContextProps>(undefined!);

export default FilesModelContext;
