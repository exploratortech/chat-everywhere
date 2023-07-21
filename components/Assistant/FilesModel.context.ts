import { ActionType } from "@/hooks/useCreateReducer";
import { Dispatch, createContext } from "react";

export interface FilesModelState {
  
}

export interface FilesModelContextProps {
  state: FilesModelState;
  dispatch: Dispatch<ActionType<FilesModelState>>;
  closeModel: () => void;
}

const FilesModelContext = createContext<FilesModelContextProps>(undefined!);

export default FilesModelContext;
